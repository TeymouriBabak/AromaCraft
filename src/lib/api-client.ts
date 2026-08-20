export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function buildUrl(path: string) {
  const rawBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
  const base = rawBase || '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalizedPath;
  // If both base and path contain an "/api" segment at the join boundary, avoid duplicate "/api/api"
  if (base.endsWith('/api') && normalizedPath.startsWith('/api')) {
    return `${base}${normalizedPath.slice(4)}`; // remove leading /api from path
  }
  return `${base}${normalizedPath}`;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const output: Record<string, string> = {};
    headers.forEach((value, key) => {
      output[key] = value;
    });
    return output;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

function getErrorMessage(payload: unknown, fallbackStatusText: string, fallbackMessage: string) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (record.error && typeof record.error === 'object') {
      const errorPayload = record.error as Record<string, unknown>;
      if (typeof errorPayload.message === 'string' && errorPayload.message) {
        return errorPayload.message;
      }
      if (typeof errorPayload.code === 'string' && errorPayload.code) {
        return errorPayload.code;
      }
    }
    if (typeof record.message === 'string' && record.message) {
      return record.message;
    }
  }
  return fallbackMessage || fallbackStatusText || 'API request failed';
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message = getErrorMessage(payload, res.statusText, 'Request failed');
    const errorPayload = payload && typeof payload === 'object' && 'error' in payload ? (payload as Record<string, unknown>).error : undefined;
    const code = errorPayload && typeof errorPayload === 'object' && 'code' in errorPayload ? (errorPayload as Record<string, unknown>).code : undefined;
    const details = errorPayload && typeof errorPayload === 'object' && 'details' in errorPayload ? (errorPayload as Record<string, unknown>).details : payload;
    throw new ApiError(message, res.status, typeof code === 'string' ? code : undefined, details);
  }

  if (payload && typeof payload === 'object' && 'ok' in payload) {
    const wrappedPayload = payload as Record<string, unknown>;
    if (wrappedPayload.ok) {
      return (wrappedPayload.data as T) ?? (null as T);
    }
    const errorPayload = wrappedPayload.error as Record<string, unknown> | undefined;
    throw new ApiError(
      typeof errorPayload?.message === 'string' ? errorPayload.message : 'API request failed',
      400,
      typeof errorPayload?.code === 'string' ? errorPayload.code : undefined,
      errorPayload?.details,
    );
  }

  return payload as T;
}

export function handleApiError(error: unknown, fallbackMessage = 'Something went wrong') {
  if (error instanceof ApiError) {
    return error;
  }
  // Map AbortErrors/DOMExceptions from fetch aborts to a user-friendly timeout message
  if (error instanceof Error) {
    const name = (error as Error & { name?: string }).name;
    const message = error.message || fallbackMessage;
    if (name === 'AbortError' || name === 'TimeoutError') {
      return new ApiError('Server did not respond in time. Please try again.', 504);
    }
    return new ApiError(message || fallbackMessage, 500);
  }
  return new ApiError(fallbackMessage, 500);
}

export async function apiRequest<T = unknown>(path: string, opts: RequestInit = {}) {
  const url = buildUrl(path);
  const headers = { ...DEFAULT_HEADERS, ...normalizeHeaders(opts.headers) } as Record<string, string>;
  const res = await fetch(url, { ...opts, credentials: 'include', headers });
  return parseResponse<T>(res);
}

export const api = {
  get: <T = unknown>(p: string, opts?: RequestInit) => apiRequest<T>(p, { method: 'GET', ...(opts ?? {}) }),
  post: <T = unknown>(p: string, body?: unknown, opts?: RequestInit) => apiRequest<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...(opts ?? {}) }),
  put: <T = unknown>(p: string, body?: unknown, opts?: RequestInit) => apiRequest<T>(p, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...(opts ?? {}) }),
  del: <T = unknown>(p: string, opts?: RequestInit) => apiRequest<T>(p, { method: 'DELETE', ...(opts ?? {}) }),
};

export default api;

import type { NextApiRequest, NextApiResponse } from 'next';

export type ApiSuccess<T> = {
  ok: true;
  success: true;
  data: T;
  error: null;
};
export type ApiError = {
  ok: false;
  success: false;
  data: null;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function jsonSuccess<T>(
  res: NextApiResponse,
  data: T,
  status = 200
): void {
  res.status(status).json({ ok: true, success: true, data, error: null });
}

export function jsonError(
  res: NextApiResponse,
  code: string,
  message: string,
  status = 400,
  details?: unknown
): void {
  res.status(status).json({
    ok: false,
    success: false,
    data: null,
    error: { code, message, ...(details === undefined ? {} : { details }) },
  });
}

export function parseJsonBody<T>(req: NextApiRequest): T | null {
  if (!req.body) return null;
  return req.body as T;
}

export function validateMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: string[]
) {
  if (!allowed.includes(req.method || '')) {
    jsonError(res, 'method_not_allowed', 'Method not allowed', 405, {
      allowed,
    });
    return null;
  }
  return null;
}

export function getCookieValue(req: NextApiRequest, name: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? match.split('=')[1] : null;
}

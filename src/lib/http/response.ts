export type ApiResponse<T> = {
  ok: boolean;
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
};

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, success: true, data };
}

export function fail(code: string, message: string, details?: unknown) {
  return { ok: false, success: false, error: { code, message, details } };
}

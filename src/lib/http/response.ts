export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function fail(code: string, message: string, details?: unknown) {
  return { success: false, error: { code, message, details } }
}

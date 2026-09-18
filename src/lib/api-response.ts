/**
 * Standardized API Response Format
 * All endpoints MUST return: { success: boolean, data?: T, error?: { code: string, message: string, details?: any } }
 */
import type { NextApiResponse } from 'next';

export type ApiResponseFormat<T = unknown> = {
  ok: boolean;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};

/**
 * Send successful API response
 */
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    ok: true,
    success: true,
    data,
    error: null,
  } as ApiResponseFormat<T>);
}

/**
 * Send error API response
 * @param code - Machine-readable error code (e.g., 'invalid_credentials', 'not_found')
 * @param message - User-friendly error message
 * @param details - Optional error details for debugging
 */
export function sendError(
  res: NextApiResponse,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown
): void {
  const errorObject: Record<string, unknown> = {
    code,
    message,
  };
  if (details !== undefined && details !== null) {
    errorObject.details = details;
  }
  res.status(statusCode).json({
    ok: false,
    success: false,
    data: null,
    error: errorObject,
  } as ApiResponseFormat);
}

/**
 * Validation error response (400 Bad Request)
 */
export function sendValidationError(
  res: NextApiResponse,
  message: string,
  details?: unknown
): void {
  sendError(res, 'validation_error', message, 400, details);
}

/**
 * Authentication error response (401 Unauthorized)
 */
export function sendUnauthorized(
  res: NextApiResponse,
  message: string = 'Unauthorized'
): void {
  sendError(res, 'unauthorized', message, 401);
}

/**
 * Forbidden error response (403 Forbidden)
 */
export function sendForbidden(
  res: NextApiResponse,
  message: string = 'Forbidden'
): void {
  sendError(res, 'forbidden', message, 403);
}

/**
 * Not found error response (404 Not Found)
 */
export function sendNotFound(
  res: NextApiResponse,
  message: string = 'Not found'
): void {
  sendError(res, 'not_found', message, 404);
}

/**
 * Server error response (500 Internal Server Error)
 */
export function sendServerError(
  res: NextApiResponse,
  message: string = 'Internal server error',
  details?: unknown
): void {
  sendError(res, 'server_error', message, 500, details);
}

/**
 * Rate limit exceeded response (429 Too Many Requests)
 */
export function sendRateLimitExceeded(
  res: NextApiResponse,
  message: string = 'Too many requests'
): void {
  sendError(res, 'rate_limit_exceeded', message, 429);
}

/**
 * Method not allowed response (405 Method Not Allowed)
 */
export function sendMethodNotAllowed(
  res: NextApiResponse,
  allowedMethods: string[]
): void {
  res.setHeader('Allow', allowedMethods.join(', '));
  sendError(res, 'method_not_allowed', 'Method not allowed', 405);
}

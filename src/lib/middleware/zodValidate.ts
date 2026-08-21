import { z } from 'zod';
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendValidationError } from '@/lib/api-response';

/**
 * Zod Schema Validation Middleware
 * All API request payloads validated before reaching handlers
 * 
 * OCL Rule 8: Server-Side Validation (Zod)
 * Every entry point (Request Body/Params) must be validated using Zod schemas
 */

export function validateBody(schema: z.ZodTypeAny) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
          .join('; ');
        
        return sendValidationError(res, 'Request validation failed.', {
          errors,
          errorMessages,
        });
      }
      req.body = result.data;
      return handler(req, res);
    };
  };
}

export function validateQuery(schema: z.ZodTypeAny) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
          .join('; ');
        
        return sendValidationError(res, 'Query parameters validation failed.', {
          errors,
          errorMessages,
        });
      }
      req.query = result.data;
      return handler(req, res);
    };
  };
}

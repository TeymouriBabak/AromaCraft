/**
 * Review Validation Schemas (Zod)
 * OCL Rules 18, 19, 20: Review must have valid authorID, rating 1-5, author matches session user
 */
import { z } from 'zod';

/**
 * OCL Rule 19: Review.rating must be an integer between 1 and 5
 * OCL Rule 20: Review.author must match the session.user who created it
 */
export const createReviewSchema = z.object({
  destination: z.string().trim().optional(),
  rating: z
    .number()
    .int('Rating must be a whole number.')
    .min(1, 'Rating must be at least 1.')
    .max(5, 'Rating must not exceed 5.'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(160, 'Title is too long.'),
  content: z
    .string()
    .trim()
    .min(12, 'Please share a few more details about your experience.')
    .max(2000, 'Review content is too long.'),
});

export type CreateReviewPayload = z.infer<typeof createReviewSchema>;

/**
 * List reviews with pagination
 */
export const listReviewsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(30),
  offset: z.number().int().min(0).optional().default(0),
});

export type ListReviewsPayload = z.infer<typeof listReviewsSchema>;

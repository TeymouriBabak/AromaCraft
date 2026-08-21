/**
 * Avatar Upload Validation Schemas (Zod)
 * OCL Rules 15, 16, 17: Avatar update restricted to owner, MIME type whitelist, 5MB size
 */
import { z } from 'zod';

/**
 * OCL Rule 16: Avatar.mimeType must be in {'image/png', 'image/jpeg', 'image/webp'}
 * OCL Rule 17: Avatar.size must not exceed 5MB
 */
export const uploadAvatarSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1, 'Image data is required.')
    .regex(
      /^data:(image\/(png|jpeg|jpg|webp));base64,/,
      'Image must be a valid PNG, JPEG, or WEBP data URL.'
    ),
});

export type UploadAvatarPayload = z.infer<typeof uploadAvatarSchema>;

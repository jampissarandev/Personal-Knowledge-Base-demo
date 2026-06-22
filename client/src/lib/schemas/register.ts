import { z } from 'zod';
import { passwordRule } from '@/lib/password';

/**
 * Register form schema. `displayName` is optional; the backend treats
 * an empty string as null. `z.string().max(100).optional().or(z.literal(''))`
 * allows the form to submit an empty string while still enforcing the
 * max-length cap when the user types something.
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.')
    .max(256, 'Email must be at most 256 characters.'),
  password: passwordRule,
  displayName: z
    .string()
    .max(100, 'Display name must be at most 100 characters.')
    .optional()
    .or(z.literal('')),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

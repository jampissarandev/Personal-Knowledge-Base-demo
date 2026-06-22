import { z } from 'zod';

/**
 * Login form schema. Minimal — email + non-empty password. The server
 * does the credential check; we only need to filter obvious garbage
 * before the network round-trip.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.')
    .max(256, 'Email must be at most 256 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(100, 'Password must be at most 100 characters.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

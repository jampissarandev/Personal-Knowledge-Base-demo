import { z } from 'zod';

/**
 * Reusable password rule shared by the register schema and any future
 * password-change flow. Mirrors the backend policy in
 * `server/PersonalKnowledgeBase.Api/Program.cs` (Identity options):
 * min 8 chars + at least one uppercase, one lowercase, and one digit.
 *
 * Note: the backend sets `RequireNonAlphanumeric = false` (a deliberate
 * choice — strong passphrases like "CorrectHorseBatteryStaple" are
 * easier to remember than symbol-soup passwords). This client rule
 * intentionally omits the symbol requirement so the two stay aligned;
 * if the server policy is ever tightened, add a matching regex here.
 */
export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(100, 'Password must be at most 100 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one digit.');

export type PasswordRule = z.infer<typeof passwordRule>;

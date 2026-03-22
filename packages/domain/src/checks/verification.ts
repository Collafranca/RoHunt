import { z } from "zod";

export const checkStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const verificationCheckSchema = z.object({
  userId: z.string().min(1),
  status: checkStatusSchema,
  reason: z.string().max(500).optional(),
});

export type VerificationCheck = z.infer<typeof verificationCheckSchema>;

export function parseVerificationCheck(input: unknown): VerificationCheck {
  return verificationCheckSchema.parse(input);
}

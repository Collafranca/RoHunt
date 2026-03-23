import { z } from "zod";

export const scamCategorySchema = z.enum([
  "impersonation",
  "non_payment",
  "account_takeover",
  "malicious_file",
  "other",
]);

export const scamReportSchema = z
  .object({
    reportedUserId: z.string().min(1),
    category: scamCategorySchema,
    details: z.string().min(20).max(2000),
    evidenceLinks: z.array(z.string().url()).max(10).default([]),
  })
  .strict();

export type ScamReport = z.infer<typeof scamReportSchema>;

export function parseScamReport(input: unknown): ScamReport {
  return scamReportSchema.parse(input);
}

import { z } from "zod";

export const reviewSectionSchema = z.object({
  section: z.string().trim().min(1),
  score: z.number().int().min(1).max(5),
  summary: z.string().trim().min(1).max(2000),
  evidence: z.array(z.string().trim().min(1)).max(20),
});

export const reviewSectionsSchema = z.array(reviewSectionSchema).min(1);

export type ReviewSection = z.infer<typeof reviewSectionSchema>;

export function parseReviewSections(input: unknown): ReviewSection[] {
  return reviewSectionsSchema.parse(input);
}

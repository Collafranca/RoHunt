import { z } from "zod";

export const jobTypeSchema = z.enum(["contract", "full_time", "part_time", "gig"]);

export const notificationFilterSchema = z
  .object({
    jobTypes: z.array(jobTypeSchema).min(1).optional(),
    minPayment: z.number().finite().nonnegative().optional(),
    maxPayment: z.number().finite().nonnegative().optional(),
    includeKeywords: z.array(z.string().trim().min(1)).min(1).optional(),
    remoteOnly: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "At least one notification filter criterion is required",
  )
  .refine(
    (value) => value.minPayment === undefined || value.maxPayment === undefined || value.minPayment <= value.maxPayment,
    "minPayment must be less than or equal to maxPayment",
  );

export type NotificationFilter = z.infer<typeof notificationFilterSchema>;

export function parseNotificationFilter(input: unknown): NotificationFilter {
  return notificationFilterSchema.parse(input);
}

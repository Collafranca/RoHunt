import { z } from "zod";

const cadenceSchema = z
  .enum(["fixed", "hour", "day", "week", "month", "hourly", "daily", "weekly", "monthly"])
  .transform((value) => {
    if (value === "hourly") return "hour";
    if (value === "daily") return "day";
    if (value === "weekly") return "week";
    if (value === "monthly") return "month";
    return value;
  });

const paymentInputSchema = z.object({
  amount: z.number().finite(),
  currency: z.string().min(1),
  cadence: cadenceSchema,
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  cadence: z.enum(["fixed", "hour", "day", "week", "month"]),
});

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentInput = z.input<typeof paymentInputSchema>;

export function normalizePayment(input: PaymentInput): Payment {
  const parsed = paymentInputSchema.parse(input);

  return paymentSchema.parse({
    amount: Number(parsed.amount.toFixed(2)),
    currency: parsed.currency.trim().toUpperCase(),
    cadence: parsed.cadence,
  });
}

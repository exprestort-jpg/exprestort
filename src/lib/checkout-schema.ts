import { z } from "zod";

/**
 * Shared by the checkout form and the server action, so a field can never be
 * accepted in the browser and rejected on the server (or the reverse). The
 * server still validates independently — this module is convenience for the
 * customer, not a substitute for it.
 */

export const lineSchema = z.object({
  variantId: z.number().int().positive(),
  qty: z.number().int().min(1).max(50),
});

/** Ukrainian mobile numbers, with or without the +38 prefix and separators. */
export const phoneField = z
  .string()
  .min(9, "Вкажіть телефон")
  .max(32)
  .refine((value) => /^(\+?38)?0\d{9}$/.test(value.replace(/[\s()-]/g, "")), {
    message: "Телефон у форматі 0XX XXX XX XX",
  });

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Вкажіть ім'я").max(120),
  phone: phoneField,
  npCityRef: z.string().min(1, "Оберіть місто"),
  npCityName: z.string().min(1, "Оберіть місто"),
  npWarehouseRef: z.string().min(1, "Оберіть відділення"),
  npWarehouseName: z.string().min(1, "Оберіть відділення"),
  comment: z.string().max(1000).optional(),
  lines: z.array(lineSchema).min(1, "Кошик порожній"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

/** Single-field check for live feedback. Returns null when the value is fine. */
export function validateCheckoutField(
  field: keyof CheckoutInput,
  value: unknown,
): string | null {
  const shape = checkoutSchema.shape[field];
  if (!shape) return null;

  const result = shape.safeParse(value);
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? "Некоректне значення");
}

/** Flattens a failed parse into one message per field. */
export function toCheckoutFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

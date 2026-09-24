import { z } from "zod";
import { TRUST_ICON_NAMES } from "./trust-icons";

/**
 * Validation shared by the admin forms and the server actions behind them, so
 * a value can never be accepted in the browser and rejected on the server.
 *
 * Only the *text* fields live here. Numbers and checkboxes arrive as strings in
 * FormData and are coerced inside each action; they also have no message the
 * admin could act on, so live validation would have nothing to say about them.
 * Each action extends the object below with those remaining fields.
 *
 * The server parses independently — this module is convenience for the admin,
 * not a substitute for server validation.
 */

const slugField = z
  .string()
  .min(2, "Вкажіть адресу")
  .max(64, "Адреса задовга")
  .regex(/^[a-z0-9-]+$/, "Тільки латиниця, цифри та дефіс");

/** Image fields are optional, so an empty string has to pass. */
const imageUrlField = z
  .string()
  .url("Некоректне посилання")
  .or(z.literal(""))
  .optional();

export const categoryTextSchema = z.object({
  title: z.string().min(2, "Вкажіть назву").max(120, "Назва задовга"),
  slug: slugField,
  description: z.string().max(2000, "Опис задовгий").optional(),
  imageUrl: imageUrlField,
  seoTitle: z.string().max(180, "Заголовок задовгий").optional(),
  seoDescription: z.string().max(320, "Опис задовгий").optional(),
});

export const pageTextSchema = z.object({
  title: z.string().min(2, "Вкажіть заголовок").max(160, "Заголовок задовгий"),
  slug: slugField,
  body: z.string().max(80_000, "Текст задовгий"),
  seoTitle: z.string().max(180, "Заголовок задовгий").optional(),
  seoDescription: z.string().max(320, "Опис задовгий").optional(),
});

export const productTextSchema = z.object({
  title: z.string().min(2, "Вкажіть назву").max(160, "Назва задовга"),
  slug: slugField,
  shortDescription: z.string().max(240, "Опис задовгий").optional(),
  description: z.string().max(4000, "Опис задовгий").optional(),
  badge: z.string().max(24, "Позначка задовга").optional(),
  setContents: z.string().max(1000, "Список задовгий").optional(),
  seoTitle: z.string().max(180, "Заголовок задовгий").optional(),
  seoDescription: z.string().max(320, "Опис задовгий").optional(),
});

/**
 * Repeater rows are validated field by field rather than as an object: the
 * price reaches the action as typed text and only becomes kopiyky there.
 */
export const variantRowSchema = z.object({
  label: z.string().min(1, "Вкажіть розмір").max(40, "Задовгий"),
  weightLabel: z.string().max(40, "Задовга").optional(),
  price: z
    .string()
    .min(1, "Вкажіть ціну")
    .refine((value) => Number(value.replace(",", ".")) > 0, "Вкажіть ціну"),
});

export const sectionRowSchema = z.object({
  title: z.string().min(1, "Вкажіть заголовок").max(80, "Заголовок задовгий"),
  body: z.string().min(1, "Вкажіть текст"),
});

export const reviewTextSchema = z.object({
  author: z.string().min(2, "Вкажіть ім'я").max(80, "Ім'я задовге"),
  avatarUrl: imageUrlField,
  text: z.string().min(10, "Відгук закороткий").max(1200, "Відгук задовгий"),
});

export const trustTextSchema = z.object({
  label: z.string().min(2, "Вкажіть текст").max(80, "Текст задовгий"),
  icon: z.enum(TRUST_ICON_NAMES as [string, ...string[]], {
    message: "Оберіть іконку",
  }),
  scope: z.enum(["main", "category"]),
});

export const settingsTextSchema = z.object({
  phone: z.string().min(5, "Вкажіть телефон").max(32, "Телефон задовгий"),
  workingHours: z.string().max(160, "Задовгий"),
  promoStripText: z.string().max(160, "Задовгий"),
  heroTitle: z.string().max(160, "Заголовок задовгий"),
  heroTitleAccent: z.string().max(160, "Заголовок задовгий"),
  heroSubtitle: z.string().max(320, "Підзаголовок задовгий"),
  heroScript: z.string().max(80, "Напис задовгий"),
  heroImageUrl: z.string().url("Некоректне посилання").or(z.literal("")),
  aboutTitle: z.string().max(160, "Заголовок задовгий"),
  aboutText: z.string().max(2000, "Текст задовгий"),
  aboutBullets: z.string().max(1000, "Список задовгий"),
  aboutImageUrl: z.string().url("Некоректне посилання").or(z.literal("")),
  seoTitle: z.string().max(160, "Заголовок задовгий"),
  seoDescription: z.string().max(320, "Опис задовгий"),
});

"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { deleteBlobs } from "@/lib/blob";
import { type FormState, str, toFieldErrors } from "@/lib/form";
import { assertAdmin } from "@/lib/require-admin";

const schema = z.object({
  phone: z.string().min(5, "Вкажіть телефон").max(32),
  workingHours: z.string().max(160),
  promoStripText: z.string().max(160),
  heroTitle: z.string().max(160),
  heroSubtitle: z.string().max(320),
  heroScript: z.string().max(80),
  heroImageUrl: z.string().url("Некоректне посилання").or(z.literal("")),
  aboutTitle: z.string().max(160),
  aboutText: z.string().max(2000),
  aboutImageUrl: z.string().url("Некоректне посилання").or(z.literal("")),
});

export async function saveSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();

  const parsed = schema.safeParse({
    phone: str(formData, "phone"),
    workingHours: str(formData, "workingHours"),
    promoStripText: str(formData, "promoStripText"),
    heroTitle: str(formData, "heroTitle"),
    heroSubtitle: str(formData, "heroSubtitle"),
    heroScript: str(formData, "heroScript"),
    heroImageUrl: str(formData, "heroImageUrl"),
    aboutTitle: str(formData, "aboutTitle"),
    aboutText: str(formData, "aboutText"),
    aboutImageUrl: str(formData, "aboutImageUrl"),
  });

  if (!parsed.success) return toFieldErrors(parsed.error);

  const values = {
    ...parsed.data,
    heroImageUrl: parsed.data.heroImageUrl || null,
    aboutImageUrl: parsed.data.aboutImageUrl || null,
    updatedAt: new Date(),
  };

  const [previous] = await db
    .select({
      heroImageUrl: siteSettings.heroImageUrl,
      aboutImageUrl: siteSettings.aboutImageUrl,
    })
    .from(siteSettings)
    .limit(1);

  // Always row 1: the table is a singleton, so an upsert avoids a missing-row
  // branch on a fresh database.
  await db
    .insert(siteSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: siteSettings.id, set: values });

  // Replaced photos are no longer referenced anywhere.
  await deleteBlobs(
    [
      [previous?.heroImageUrl, values.heroImageUrl],
      [previous?.aboutImageUrl, values.aboutImageUrl],
    ]
      .filter(([before, after]) => before && before !== after)
      .map(([before]) => before),
  );

  updateTag("settings");
  // No redirect — the admin stays on the page, so give them feedback instead.
  return { error: undefined, fieldErrors: undefined, saved: true };
}

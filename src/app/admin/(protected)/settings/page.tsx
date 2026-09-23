import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { SettingsForm } from "./settings-form";

export const instant = false;

export default async function SettingsPage() {
  await requireAdmin();

  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Налаштування</h1>
          <p className={styles.subtitle}>
            Контакти й тексти, що повторюються на всьому сайті.
          </p>
        </div>
      </header>
      <SettingsForm
        values={{
          phone: settings?.phone ?? "",
          workingHours: settings?.workingHours ?? "",
          promoStripText: settings?.promoStripText ?? "",
          heroTitle: settings?.heroTitle ?? "",
          heroSubtitle: settings?.heroSubtitle ?? "",
          heroScript: settings?.heroScript ?? "",
          heroImageUrl: settings?.heroImageUrl ?? "",
          aboutTitle: settings?.aboutTitle ?? "",
          aboutText: settings?.aboutText ?? "",
          aboutImageUrl: settings?.aboutImageUrl ?? "",
        }}
      />
    </>
  );
}

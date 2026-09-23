import { Truck } from "lucide-react";
import styles from "@/components/shop/chrome.module.css";
import { SiteFooter } from "@/components/shop/site-footer";
import { SiteHeader } from "@/components/shop/site-header";
import { getMenuCategories, getSettings } from "@/lib/queries";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getMenuCategories(),
  ]);

  return (
    <>
      {settings?.promoStripText ? (
        <div className={styles.promo}>
          <Truck size={14} strokeWidth={2} aria-hidden />
          <span>{settings.promoStripText}</span>
        </div>
      ) : null}

      <SiteHeader
        categories={categories.map((category) => ({
          slug: category.slug,
          title: category.title,
          productCount: category.productCount,
        }))}
        phone={settings?.phone ?? ""}
      />

      <main>{children}</main>

      <SiteFooter
        categories={categories.map((category) => ({
          slug: category.slug,
          title: category.title,
        }))}
        phone={settings?.phone ?? ""}
        workingHours={settings?.workingHours ?? ""}
      />
    </>
  );
}

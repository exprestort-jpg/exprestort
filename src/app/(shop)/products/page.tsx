import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import catalogStyles from "@/components/shop/catalog.module.css";
import homeStyles from "@/components/shop/home.module.css";
import { PageSkeleton } from "@/components/shop/page-skeleton";
import styles from "@/components/shop/product.module.css";
import { ProductRow } from "@/components/shop/product-row";
import { getCatalogSections } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Всі коржі — Експрес-торт",
  description:
    "Повний перелік коржів власного випікання за категоріями: медові, бісквітні, шоколадні та «Наполеон».",
};

async function ProductSections() {
  const sections = await getCatalogSections();

  if (sections.length === 0) {
    return (
      <p className={styles.categoryDesc}>
        Товарів поки немає. Зазирніть трохи пізніше.
      </p>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <section key={section.slug} className={homeStyles.section}>
          <div className={homeStyles.sectionHeader}>
            <h2 className={homeStyles.sectionTitle}>{section.title}</h2>
            <Link
              href={`/catalog/${section.slug}`}
              className={homeStyles.sectionLink}
            >
              до категорії
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <div className={catalogStyles.list}>
            {section.products.map((product) => (
              <ProductRow key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/**
 * Every product on one page, grouped by category — the destination of «всі
 * коржі». /catalog stays the category-tile entry point; this is the flat list
 * for people who would rather scroll than pick.
 */
export default function AllProductsPage() {
  return (
    <>
      <div className={styles.categoryHead}>
        <Breadcrumbs
          trail={[{ href: "/", label: "Головна" }, { label: "Всі коржі" }]}
        />
        <h1 className={styles.categoryTitle}>Всі коржі</h1>
        <p className={styles.categoryDesc}>
          Повний асортимент за категоріями — оберіть коржі й додайте в кошик.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <ProductSections />
      </Suspense>
    </>
  );
}

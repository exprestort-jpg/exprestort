import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import catalogStyles from "@/components/shop/catalog.module.css";
import homeStyles from "@/components/shop/home.module.css";
import { PageSkeleton } from "@/components/shop/page-skeleton";
import styles from "@/components/shop/product.module.css";
import { ProductRow } from "@/components/shop/product-row";
import { TrustIcon } from "@/components/trust-icon";
import {
  getCategoryBySlug,
  getCategoryProducts,
  getTrustItems,
} from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.seoTitle ?? `${category.title} — Експрес-торт`,
    description: category.seoDescription ?? category.description ?? undefined,
  };
}

async function CategoryContent({
  params,
}: Pick<PageProps<"/catalog/[slug]">, "params">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, trust] = await Promise.all([
    getCategoryProducts(category.id),
    getTrustItems("category"),
  ]);

  return (
    <>
      <div className={styles.categoryHead}>
        <Breadcrumbs
          trail={[
            { href: "/", label: "Головна" },
            { href: "/catalog", label: "Каталог" },
            { label: category.title },
          ]}
        />
        <h1 className={styles.categoryTitle}>{category.title}</h1>
        {category.description ? (
          <p className={styles.categoryDesc}>{category.description}</p>
        ) : null}

        {products.length === 0 ? (
          <p className={styles.categoryDesc}>
            У цій категорії поки немає товарів. Зазирніть трохи пізніше.
          </p>
        ) : (
          <div className={catalogStyles.list}>
            {products.map((product) => (
              <ProductRow key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>

      {trust.length > 0 ? (
        <section className={`${homeStyles.section} ${homeStyles.sectionAlt}`}>
          <div className={homeStyles.trustRow}>
            {trust.map((item) => (
              <div key={item.id} className={homeStyles.trustItem}>
                <span className={homeStyles.trustIcon}>
                  <TrustIcon name={item.icon} size={19} />
                </span>
                <span className={homeStyles.trustLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * `params` is awaited inside the boundary rather than at the top level, so the
 * shell still prerenders for slugs generateStaticParams did not list — a
 * category added in the admin after the last build gets a fast first paint too.
 */
export default function CategoryPage({ params }: PageProps<"/catalog/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

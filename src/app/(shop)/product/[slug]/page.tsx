import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { PageSkeleton } from "@/components/shop/page-skeleton";
import styles from "@/components/shop/product.module.css";
import { ProductDetail } from "@/components/shop/product-detail";
import { getAllProductSlugs, getProductBySlug, toLines } from "@/lib/queries";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return {};

  return {
    title: data.product.seoTitle ?? `${data.product.title} — Експрес-торт`,
    description:
      data.product.seoDescription ?? data.product.shortDescription ?? undefined,
  };
}

async function ProductContent({
  params,
}: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();

  const { product, categorySlug, categoryTitle, variants, images, sections } =
    data;
  const setItems = toLines(product.setContents);

  return (
    <div className={styles.body}>
      <Breadcrumbs
        trail={[
          { href: "/", label: "Головна" },
          { href: `/catalog/${categorySlug}`, label: categoryTitle },
          { label: product.title },
        ]}
      />

      <ProductDetail
        productId={product.id}
        slug={product.slug}
        title={product.title}
        images={images.map((image) => ({ url: image.url, alt: image.alt }))}
        variants={variants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          weightLabel: variant.weightLabel,
          priceKop: variant.priceKop,
        }))}
        sections={sections.map((section) => ({
          id: section.id,
          title: section.title,
          body: section.body,
        }))}
      >
        <h1 className={styles.title}>{product.title}</h1>
        {product.description ? (
          <p className={styles.description}>{product.description}</p>
        ) : null}

        {setItems.length > 0 ? (
          <div className={styles.setContents}>
            <p className={styles.setTitle}>Склад набору:</p>
            {setItems.map((item) => (
              <p key={item} className={styles.setItem}>
                <span className={styles.setMarker} aria-hidden />
                {item}
              </p>
            ))}
          </div>
        ) : null}
      </ProductDetail>
    </div>
  );
}

/**
 * `params` is awaited inside the boundary rather than at the top level, so the
 * shell still prerenders for slugs generateStaticParams did not list — a
 * category added in the admin after the last build gets a fast first paint too.
 */
export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

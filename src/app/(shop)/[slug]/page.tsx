import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { PageSkeleton } from "@/components/shop/page-skeleton";
import styles from "@/components/shop/product.module.css";
import { getAllPageSlugs, getPageBySlug } from "@/lib/queries";

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs();
  return slugs.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.seoTitle ?? `${page.title} — Експрес-торт`,
    description: page.seoDescription ?? undefined,
  };
}

async function StaticPageContent({
  params,
}: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <article className={styles.prose}>
      <Breadcrumbs
        trail={[{ href: "/", label: "Головна" }, { label: page.title }]}
      />
      <h1 className={styles.categoryTitle}>{page.title}</h1>
      {/* Sanitized with an allow-list on save, in savePage. */}
      <div
        className={styles.proseBody}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: body is sanitized server-side before storage
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </article>
  );
}

/**
 * `params` is awaited inside the boundary rather than at the top level, so the
 * shell still prerenders for slugs generateStaticParams did not list — a
 * category added in the admin after the last build gets a fast first paint too.
 */
export default function StaticPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StaticPageContent params={params} />
    </Suspense>
  );
}

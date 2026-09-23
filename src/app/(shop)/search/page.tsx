import { Search } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import catalogStyles from "@/components/shop/catalog.module.css";
import { PageSkeleton } from "@/components/shop/page-skeleton";
import styles from "@/components/shop/product.module.css";
import { ProductRow } from "@/components/shop/product-row";
import {
  normalizeSearchQuery,
  SEARCH_MIN_LENGTH,
  searchProducts,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Пошук коржів — Експрес-торт",
  description: "Знайдіть коржі за назвою: медовик, бісквіт, шоколад, наполеон.",
  robots: { index: false },
};

/**
 * A plain GET form: Enter submits, the term lives in the URL, and the results
 * are shareable and cacheable. No client bundle for any of it.
 */
async function SearchBody({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const raw = Array.isArray(q) ? q[0] : q;
  const term = normalizeSearchQuery(raw);
  const products =
    term.length >= SEARCH_MIN_LENGTH ? await searchProducts(term) : [];

  return (
    <>
      <form className={catalogStyles.searchForm} action="/search" method="get">
        <span className={catalogStyles.searchField}>
          <Search
            size={18}
            strokeWidth={1.75}
            className={catalogStyles.searchIcon}
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={raw ?? ""}
            placeholder="Назва коржів…"
            aria-label="Пошук коржів за назвою"
            autoComplete="off"
            className={catalogStyles.searchInput}
          />
        </span>
        <button type="submit" className="buttonPrimary">
          Знайти
        </button>
      </form>

      {term.length < SEARCH_MIN_LENGTH ? (
        <p className={styles.categoryDesc}>
          Введіть щонайменше {SEARCH_MIN_LENGTH} символи — наприклад «мед» або
          «бісквіт».
        </p>
      ) : products.length === 0 ? (
        <p className={styles.categoryDesc}>
          Нічого не знайшли за запитом «{term}». Спробуйте коротший запит або
          загляньте в <a href="/catalog">каталог</a>.
        </p>
      ) : (
        <>
          <p className={styles.categoryDesc}>Знайдено: {products.length}</p>
          <div className={catalogStyles.list}>
            {products.map((product) => (
              <ProductRow key={product.slug} product={product} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/**
 * `searchParams` is awaited inside the boundary, so the heading and the shell
 * still prerender — only the results stream in per query.
 */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className={styles.categoryHead}>
      <Breadcrumbs
        trail={[{ href: "/", label: "Головна" }, { label: "Пошук" }]}
      />
      <h1 className={styles.categoryTitle}>Пошук</h1>
      <Suspense fallback={<PageSkeleton />}>
        <SearchBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

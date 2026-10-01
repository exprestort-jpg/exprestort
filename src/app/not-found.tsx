import Link from "next/link";
import styles from "@/components/shop/product.module.css";

/**
 * Streaming makes the status a lie here: the shell has already gone out with a
 * 200 by the time a `notFound()` fires inside a Suspense boundary, so an unknown
 * slug answers 200 with this body. Deciding the status earlier would mean
 * awaiting `params` at the top of the page, which Cache Components rejects as
 * runtime data during prerender — it costs the prerendered shell on every
 * product page.
 *
 * So the status stays wrong and the indexing is fixed directly: `noindex` keeps
 * these out of search results, which is the harm a soft 404 actually does.
 * React hoists this into <head>.
 */
export default function NotFound() {
  return (
    <div className={styles.prose}>
      <meta name="robots" content="noindex, follow" />
      <h1 className={styles.categoryTitle}>Сторінку не знайдено</h1>
      <p className={styles.proseBody}>
        Можливо, товар більше не продається або в адресі є помилка.
      </p>
      <Link
        href="/catalog"
        className="buttonPrimary"
        style={{ alignSelf: "flex-start" }}
      >
        Перейти до каталогу
      </Link>
    </div>
  );
}

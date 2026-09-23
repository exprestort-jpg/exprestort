import { asc, eq, min, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { categories, products, productVariants } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { DeleteProductButton } from "./delete-button";

export const instant = false;

export default async function ProductsPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      categoryTitle: categories.title,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      sort: products.sort,
      minPrice: min(productVariants.priceKop),
      variantCount: sql<number>`count(${productVariants.id})::int`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .groupBy(products.id, categories.title)
    .orderBy(asc(products.sort), asc(products.title));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Товари</h1>
          <p className={styles.subtitle}>
            Коржі, набори та все, що можна замовити.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Додати товар
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>Товарів ще немає. Додайте перший.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Назва</th>
              <th>Категорія</th>
              <th>Розмірів</th>
              <th>Ціна від</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/products/${row.id}`}>{row.title}</Link>
                  {row.isFeatured ? (
                    <span className={`${styles.pill} ${styles.pillInline}`}>
                      Популярне
                    </span>
                  ) : null}
                </td>
                <td className={styles.muted}>{row.categoryTitle}</td>
                <td>{row.variantCount}</td>
                <td>
                  {row.minPrice === null ? "—" : formatPrice(row.minPrice)}
                </td>
                <td>
                  <span
                    className={`${styles.pill} ${row.isActive ? "" : styles.pillOff}`}
                  >
                    {row.isActive ? "Активний" : "Прихований"}
                  </span>
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <Link
                      href={`/admin/products/${row.id}`}
                      className={styles.button}
                    >
                      Редагувати
                    </Link>
                    <DeleteProductButton id={row.id} title={row.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

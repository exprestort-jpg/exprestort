import { asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { DeleteCategoryButton } from "./delete-button";

export const instant = false;

export default async function CategoriesPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  await requireAdmin();
  const { error } = await searchParams;

  const rows = await db
    .select({
      id: categories.id,
      title: categories.title,
      slug: categories.slug,
      sort: categories.sort,
      isActive: categories.isActive,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sort), asc(categories.title));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Категорії</h1>
          <p className={styles.subtitle}>
            Формують меню сайту та розділи каталогу.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Додати категорію
        </Link>
      </header>

      {error === "has-products" ? (
        <p className={styles.formError} style={{ marginBottom: "var(--s-16)" }}>
          Не вдалося видалити: у категорії ще є товари. Спочатку перенесіть або
          видаліть їх.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={styles.empty}>Категорій ще немає. Додайте першу.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Назва</th>
              <th>Адреса</th>
              <th>Товарів</th>
              <th>Порядок</th>
              <th>Стан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/categories/${row.id}`}>{row.title}</Link>
                </td>
                <td className={styles.muted}>/{row.slug}</td>
                <td>{row.productCount}</td>
                <td>{row.sort}</td>
                <td>
                  <span
                    className={`${styles.pill} ${row.isActive ? "" : styles.pillOff}`}
                  >
                    {row.isActive ? "Активна" : "Прихована"}
                  </span>
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <Link
                      href={`/admin/categories/${row.id}`}
                      className={styles.button}
                    >
                      Редагувати
                    </Link>
                    <DeleteCategoryButton id={row.id} title={row.title} />
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

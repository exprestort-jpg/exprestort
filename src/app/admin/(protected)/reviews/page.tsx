import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { DeleteReviewButton } from "./delete-button";

export const instant = false;

export default async function ReviewsPage() {
  await requireAdmin();

  const rows = await db
    .select()
    .from(reviews)
    .orderBy(asc(reviews.sort), asc(reviews.id));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Відгуки</h1>
          <p className={styles.subtitle}>Показуються на головній сторінці.</p>
        </div>
        <Link
          href="/admin/reviews/new"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Додати відгук
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>Відгуків ще немає.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Автор</th>
              <th>Оцінка</th>
              <th>Текст</th>
              <th>Порядок</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/reviews/${row.id}`}>{row.author}</Link>
                </td>
                <td>{"★".repeat(row.rating)}</td>
                <td className={styles.muted}>
                  {row.text.length > 90
                    ? `${row.text.slice(0, 90)}…`
                    : row.text}
                </td>
                <td>{row.sort}</td>
                <td>
                  <div className={styles.rowActions}>
                    <Link
                      href={`/admin/reviews/${row.id}`}
                      className={styles.button}
                    >
                      Редагувати
                    </Link>
                    <DeleteReviewButton id={row.id} author={row.author} />
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

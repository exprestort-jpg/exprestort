import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { DeletePageButton } from "./delete-button";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium" });

export default async function PagesPage() {
  await requireAdmin();

  const rows = await db.select().from(pages).orderBy(asc(pages.title));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Сторінки</h1>
          <p className={styles.subtitle}>
            Про нас, політика конфіденційності, публічна оферта.
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Додати сторінку
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>Сторінок ще немає.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Адреса</th>
              <th>Оновлено</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/pages/${row.id}`}>{row.title}</Link>
                </td>
                <td className={styles.muted}>/{row.slug}</td>
                <td className={styles.muted}>
                  {dateFormat.format(row.updatedAt)}
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <Link
                      href={`/admin/pages/${row.id}`}
                      className={styles.button}
                    >
                      Редагувати
                    </Link>
                    <DeletePageButton id={row.id} title={row.title} />
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

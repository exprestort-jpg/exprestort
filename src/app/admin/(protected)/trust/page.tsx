import { asc } from "drizzle-orm";
import Link from "next/link";
import { TrustIcon } from "@/components/trust-icon";
import { db } from "@/db";
import { trustItems } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { DeleteTrustButton } from "./delete-button";

export const instant = false;

const SCOPE_LABELS = { main: "Головна", category: "Категорії" } as const;

export default async function TrustPage() {
  await requireAdmin();

  const rows = await db
    .select()
    .from(trustItems)
    .orderBy(asc(trustItems.sort), asc(trustItems.id));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Переваги</h1>
          <p className={styles.subtitle}>
            Смужка з іконками на головній та в категоріях.
          </p>
        </div>
        <Link
          href="/admin/trust/new"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Додати перевагу
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>Переваг ще немає.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Іконка</th>
              <th>Текст</th>
              <th>Де</th>
              <th>Порядок</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ color: "var(--accent-strong)" }}>
                  <TrustIcon name={row.icon} />
                </td>
                <td>
                  <Link href={`/admin/trust/${row.id}`}>{row.label}</Link>
                </td>
                <td className={styles.muted}>{SCOPE_LABELS[row.scope]}</td>
                <td>{row.sort}</td>
                <td>
                  <div className={styles.rowActions}>
                    <Link
                      href={`/admin/trust/${row.id}`}
                      className={styles.button}
                    >
                      Редагувати
                    </Link>
                    <DeleteTrustButton id={row.id} label={row.label} />
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

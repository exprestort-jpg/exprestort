import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../_components/admin.module.css";
import { StatusSelect } from "./status-select";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OrdersPage() {
  await requireAdmin();

  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Замовлення</h1>
          <p className={styles.subtitle}>
            Нові замовлення також приходять у Telegram.
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className={styles.empty}>Замовлень ще немає.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Номер</th>
              <th>Коли</th>
              <th>Клієнт</th>
              <th>Відділення</th>
              <th>Сума</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/orders/${row.id}`}>№{row.number}</Link>
                </td>
                <td className={styles.muted}>
                  {dateFormat.format(row.createdAt)}
                </td>
                <td>
                  {row.customerName}
                  <br />
                  <span className={styles.muted}>{row.phone}</span>
                </td>
                <td className={styles.muted}>
                  {row.npCityName}, {row.npWarehouseName}
                </td>
                <td>{formatPrice(row.totalKop)}</td>
                <td>
                  <StatusSelect id={row.id} status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

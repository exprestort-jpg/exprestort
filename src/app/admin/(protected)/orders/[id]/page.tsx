import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { StatusSelect } from "../status-select";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function OrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const orderId = Number(id);

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(asc(orderItems.id));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Замовлення №{order.number}</h1>
          <p className={styles.subtitle}>
            {dateFormat.format(order.createdAt)}
          </p>
        </div>
        <StatusSelect id={order.id} status={order.status} />
      </header>

      <div className={styles.form} style={{ marginBottom: "var(--s-24)" }}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <span className={styles.label}>Клієнт</span>
            <span>{order.customerName}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Телефон</span>
            <a href={`tel:${order.phone}`}>{order.phone}</a>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Доставка</span>
          <span>
            {order.npCityName}, {order.npWarehouseName}
          </span>
        </div>

        {order.comment ? (
          <div className={styles.field}>
            <span className={styles.label}>Коментар</span>
            <span>{order.comment}</span>
          </div>
        ) : null}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Товар</th>
            <th>Розмір</th>
            <th>Ціна</th>
            <th>К-сть</th>
            <th>Сума</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.titleSnap}</td>
              <td className={styles.muted}>{item.variantSnap}</td>
              <td>{formatPrice(item.priceKopSnap)}</td>
              <td>{item.qty}</td>
              <td>{formatPrice(item.priceKopSnap * item.qty)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ fontWeight: 700, textAlign: "right" }}>
              Разом
            </td>
            <td style={{ fontWeight: 700 }}>{formatPrice(order.totalKop)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

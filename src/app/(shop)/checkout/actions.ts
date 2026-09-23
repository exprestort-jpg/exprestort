"use server";

import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db, withTransaction } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";
import { checkoutSchema, toCheckoutFieldErrors } from "@/lib/checkout-schema";
import { formatPrice } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { escapeHtml, notifyNewOrder } from "@/lib/telegram";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  orderNumber?: string;
};

export async function createOrder(payload: unknown): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors = toCheckoutFieldErrors(parsed.error);
    return { fieldErrors, error: fieldErrors.lines };
  }

  const data = parsed.data;
  const variantIds = data.lines.map((line) => line.variantId);

  /*
   * Prices come from the database, never from the submitted cart. The cart lives
   * in localStorage, so anything it claims about price is attacker-controlled.
   */
  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      priceKop: productVariants.priceKop,
      variantLabel: productVariants.label,
      productTitle: products.title,
      productSlug: products.slug,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        inArray(productVariants.id, variantIds),
        eq(productVariants.isActive, true),
        eq(products.isActive, true),
      ),
    );

  const byVariant = new Map(rows.map((row) => [row.variantId, row]));
  const missing = variantIds.filter((id) => !byVariant.has(id));
  if (missing.length > 0) {
    return {
      error:
        "Деяких товарів більше немає в наявності. Оновіть сторінку та перевірте кошик.",
    };
  }

  const items = data.lines.map((line) => {
    const row = byVariant.get(line.variantId);
    if (!row) throw new Error("unreachable: variant checked above");
    return {
      productId: row.productId,
      variantId: row.variantId,
      slug: row.productSlug,
      titleSnap: row.productTitle,
      variantSnap: row.variantLabel,
      priceKopSnap: row.priceKop,
      qty: line.qty,
    };
  });

  const totalKop = items.reduce(
    (sum, item) => sum + item.priceKopSnap * item.qty,
    0,
  );

  const orderNumber = await withTransaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        /*
         * The real number is derived from the row id, which does not exist
         * until after the insert, so a placeholder goes in first. It must fit
         * `number`'s varchar(16), hence the short timestamp+random token rather
         * than a UUID — and it is overwritten before the transaction commits,
         * so it never reaches the customer or the manager.
         */
        number: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        customerName: data.customerName,
        phone: data.phone,
        npCityRef: data.npCityRef,
        npCityName: data.npCityName,
        npWarehouseRef: data.npWarehouseRef,
        npWarehouseName: data.npWarehouseName,
        comment: data.comment || null,
        totalKop,
      })
      .returning({ id: orders.id });

    const number = String(10_000 + order.id);
    await tx.update(orders).set({ number }).where(eq(orders.id, order.id));
    await tx
      .insert(orderItems)
      .values(items.map((item) => ({ ...item, orderId: order.id })));

    return number;
  });

  const lines = items
    .map(
      (item) =>
        `• <a href="${siteUrl(`/product/${item.slug}`)}">${escapeHtml(item.titleSnap)}</a>` +
        ` — ${escapeHtml(item.variantSnap)} × ${item.qty} = ${formatPrice(item.priceKopSnap * item.qty)}`,
    )
    .join("\n");

  await notifyNewOrder(
    [
      `<b>Нове замовлення №${orderNumber}</b>`,
      "",
      `<b>${escapeHtml(data.customerName)}</b>`,
      `☎ <code>${escapeHtml(data.phone)}</code>`,
      `📦 ${escapeHtml(data.npCityName)}, ${escapeHtml(data.npWarehouseName)}`,
      data.comment ? `💬 ${escapeHtml(data.comment)}` : null,
      "",
      lines,
      "",
      `<b>Разом: ${formatPrice(totalKop)}</b>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  updateTag("orders");

  return { orderNumber };
}

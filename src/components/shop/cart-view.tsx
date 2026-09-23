"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cartTotalKop, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/money";
import styles from "./cart.module.css";

export function CartView() {
  const hydrated = useCart((state) => state.hydrated);
  const lines = useCart((state) => state.lines);
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);

  // Until the store rehydrates the cart is unknown, and showing "empty" first
  // would flash the wrong state for anyone who already has items.
  if (!hydrated) {
    return <p className={styles.note}>Завантажуємо кошик…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Кошик поки порожній.</p>
        <Link href="/catalog" className="buttonPrimary">
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  const total = cartTotalKop(lines);

  return (
    <>
      <div className={styles.lines}>
        {lines.map((line) => (
          <div key={line.variantId} className={styles.line}>
            <div className={styles.linePhoto}>
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt=""
                  fill
                  sizes="84px"
                  style={{ objectFit: "cover" }}
                />
              ) : null}
            </div>

            <div className={styles.lineBody}>
              <Link href={`/product/${line.slug}`} className={styles.lineTitle}>
                {line.title}
              </Link>
              <span className={styles.lineVariant}>{line.variantLabel}</span>

              <div className={styles.lineBottom}>
                <div className={styles.qty}>
                  <button
                    type="button"
                    className={styles.qtyButton}
                    onClick={() => setQty(line.variantId, line.qty - 1)}
                    disabled={line.qty <= 1}
                    aria-label="Зменшити кількість"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>
                  <span className={styles.qtyValue}>{line.qty}</span>
                  <button
                    type="button"
                    className={styles.qtyButton}
                    onClick={() => setQty(line.variantId, line.qty + 1)}
                    aria-label="Збільшити кількість"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>
                <span className={styles.linePrice}>
                  {formatPrice(line.priceKop * line.qty)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={styles.lineRemove}
              onClick={() => remove(line.variantId)}
              aria-label={`Прибрати ${line.title}`}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Разом</span>
          <span className={styles.summaryTotal}>{formatPrice(total)}</span>
        </div>
        <p className={styles.note}>
          Вартість доставки Новою Поштою оплачується окремо за тарифами
          перевізника.
        </p>
        <Link href="/checkout" className="buttonPrimary buttonBlock">
          Оформити замовлення
        </Link>
      </div>
    </>
  );
}

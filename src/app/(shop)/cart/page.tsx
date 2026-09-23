import type { Metadata } from "next";
import styles from "@/components/shop/cart.module.css";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = {
  title: "Кошик — Експрес-торт",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Кошик</h1>
      <CartView />
    </div>
  );
}

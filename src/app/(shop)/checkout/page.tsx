import type { Metadata } from "next";
import styles from "@/components/shop/cart.module.css";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Оформлення замовлення — Експрес-торт",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Оформлення замовлення</h1>
      <CheckoutForm />
    </div>
  );
}

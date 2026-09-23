import Link from "next/link";
import styles from "@/components/shop/product.module.css";

export default function NotFound() {
  return (
    <div className={styles.prose}>
      <h1 className={styles.categoryTitle}>Сторінку не знайдено</h1>
      <p className={styles.proseBody}>
        Можливо, товар більше не продається або в адресі є помилка.
      </p>
      <Link
        href="/catalog"
        className="buttonPrimary"
        style={{ alignSelf: "flex-start" }}
      >
        Перейти до каталогу
      </Link>
    </div>
  );
}

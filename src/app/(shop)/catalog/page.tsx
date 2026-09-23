import type { Metadata } from "next";
import catalogStyles from "@/components/shop/catalog.module.css";
import { CategoryTile } from "@/components/shop/category-tile";
import styles from "@/components/shop/product.module.css";
import { getMenuCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Каталог коржів — Експрес-торт",
  description:
    "Медові, бісквітні, шоколадні коржі та коржі «Наполеон» власного випікання.",
};

export default async function CatalogPage() {
  const categories = await getMenuCategories();

  return (
    <div className={styles.categoryHead}>
      <h1 className={styles.categoryTitle}>Каталог</h1>
      <p className={styles.categoryDesc}>
        Крафтові коржі власного випікання. Оберіть категорію, щоб побачити
        розміри й ціни.
      </p>
      <div className={catalogStyles.tileGrid}>
        {categories.map((category) => (
          <CategoryTile key={category.slug} category={category} />
        ))}
      </div>
    </div>
  );
}

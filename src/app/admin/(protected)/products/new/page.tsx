import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { emptyProduct, ProductForm } from "../product-form";

export const instant = false;

export default async function NewProductPage() {
  await requireAdmin();

  const categoryOptions = await db
    .select({ id: categories.id, title: categories.title })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sort));

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Новий товар</h1>
      </header>
      {categoryOptions.length === 0 ? (
        <p className={styles.empty}>Спочатку створіть хоча б одну категорію.</p>
      ) : (
        <ProductForm values={emptyProduct} categories={categoryOptions} />
      )}
    </>
  );
}

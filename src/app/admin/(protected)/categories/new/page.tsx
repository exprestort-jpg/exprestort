import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { CategoryForm, emptyCategory } from "../category-form";

export const instant = false;

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Нова категорія</h1>
      </header>
      <CategoryForm values={emptyCategory} />
    </>
  );
}

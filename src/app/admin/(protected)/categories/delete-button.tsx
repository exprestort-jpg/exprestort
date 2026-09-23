"use client";

import styles from "../_components/admin.module.css";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(event) => {
        if (!confirm(`Видалити категорію «${title}»?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={`${styles.button} ${styles.buttonDanger}`}
      >
        Видалити
      </button>
    </form>
  );
}

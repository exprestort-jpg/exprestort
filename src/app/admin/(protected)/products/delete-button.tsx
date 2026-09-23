"use client";

import styles from "../_components/admin.module.css";
import { deleteProduct } from "./actions";

export function DeleteProductButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(event) => {
        if (!confirm(`Видалити товар «${title}»?`)) event.preventDefault();
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

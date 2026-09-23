"use client";

import styles from "../_components/admin.module.css";
import { deletePage } from "./actions";

export function DeletePageButton({ id, title }: { id: number; title: string }) {
  return (
    <form
      action={deletePage}
      onSubmit={(event) => {
        if (!confirm(`Видалити сторінку «${title}»?`)) event.preventDefault();
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

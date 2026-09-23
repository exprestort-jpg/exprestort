"use client";

import styles from "../_components/admin.module.css";
import { deleteReview } from "./actions";

export function DeleteReviewButton({
  id,
  author,
}: {
  id: number;
  author: string;
}) {
  return (
    <form
      action={deleteReview}
      onSubmit={(event) => {
        if (!confirm(`Видалити відгук від ${author}?`)) event.preventDefault();
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

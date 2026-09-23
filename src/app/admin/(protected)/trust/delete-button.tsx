"use client";

import styles from "../_components/admin.module.css";
import { deleteTrustItem } from "./actions";

export function DeleteTrustButton({
  id,
  label,
}: {
  id: number;
  label: string;
}) {
  return (
    <form
      action={deleteTrustItem}
      onSubmit={(event) => {
        if (!confirm(`Видалити «${label}»?`)) event.preventDefault();
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

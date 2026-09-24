"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TrustIcon } from "@/components/trust-icon";
import { trustTextSchema } from "@/lib/admin-schemas";
import type { FormState } from "@/lib/form";
import { TRUST_ICONS } from "@/lib/trust-icons";
import { useAdminForm } from "@/lib/use-admin-form";
import styles from "../_components/admin.module.css";
import { saveTrustItem } from "./actions";

export type TrustFormValues = {
  id?: number;
  icon: string;
  label: string;
  scope: "main" | "category";
  sort: number;
};

export const emptyTrustItem: TrustFormValues = {
  icon: "croissant",
  label: "",
  scope: "main",
  sort: 0,
};

const initialState: FormState = {};

export function TrustForm({ values }: { values: TrustFormValues }) {
  const [state, formAction, pending] = useActionState(
    saveTrustItem,
    initialState,
  );
  const form = useAdminForm({
    initial: {
      label: values.label,
      icon: values.icon,
      scope: values.scope as string,
      sort: String(values.sort),
    },
    schema: trustTextSchema,
    state,
  });
  const { errors } = form;

  const rowId = state.savedId ?? values.id;

  return (
    <form action={formAction} className={styles.form}>
      {/* After a create the row id only exists in the action result; adopting
          it keeps the next save an update instead of a second insert. */}
      {rowId ? <input type="hidden" name="id" value={rowId} /> : null}

      {state.saved ? <p className={styles.savedNote}>Збережено.</p> : null}
      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="label">
          Текст
        </label>
        <input
          className={styles.input}
          {...form.field("label")}
          placeholder="Випікаємо щодня"
          required
        />
        {errors.label ? (
          <span className={styles.fieldError}>{errors.label}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="icon">
          Іконка
        </label>
        <div className={styles.repeaterHead}>
          <select
            className={styles.select}
            {...form.field("icon")}
            style={{ flex: 1 }}
          >
            {TRUST_ICONS.map((option) => (
              <option key={option.name} value={option.name}>
                {option.label}
              </option>
            ))}
          </select>
          <span aria-hidden style={{ color: "var(--accent-strong)" }}>
            <TrustIcon name={form.values.icon} size={28} />
          </span>
        </div>
        {errors.icon ? (
          <span className={styles.fieldError}>{errors.icon}</span>
        ) : null}
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="scope">
            Де показувати
          </label>
          <select className={styles.select} {...form.field("scope")}>
            <option value="main">Головна сторінка</option>
            <option value="category">Сторінки категорій</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sort">
            Порядок
          </label>
          <input
            type="number"
            min={0}
            className={styles.input}
            {...form.field("sort")}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={pending}
        >
          {pending ? "Зберігаємо…" : "Зберегти"}
        </button>
        <Link href="/admin/trust" className={styles.button}>
          Скасувати
        </Link>
      </div>
    </form>
  );
}

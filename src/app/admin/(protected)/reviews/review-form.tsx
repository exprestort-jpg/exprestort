"use client";

import Link from "next/link";
import { useActionState } from "react";
import { reviewTextSchema } from "@/lib/admin-schemas";
import type { FormState } from "@/lib/form";
import { useAdminForm } from "@/lib/use-admin-form";
import styles from "../_components/admin.module.css";
import { ImageField } from "../_components/image-field";
import { saveReview } from "./actions";

export type ReviewFormValues = {
  id?: number;
  author: string;
  avatarUrl: string;
  rating: number;
  text: string;
  sort: number;
};

export const emptyReview: ReviewFormValues = {
  author: "",
  avatarUrl: "",
  rating: 5,
  text: "",
  sort: 0,
};

const initialState: FormState = {};

export function ReviewForm({ values }: { values: ReviewFormValues }) {
  const [state, formAction, pending] = useActionState(saveReview, initialState);
  const form = useAdminForm({
    initial: {
      author: values.author,
      text: values.text,
      rating: String(values.rating),
      sort: String(values.sort),
    },
    schema: reviewTextSchema,
    state,
  });
  const { errors } = form;

  return (
    <form action={formAction} className={styles.form}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="author">
            Ім&apos;я
          </label>
          <input className={styles.input} {...form.field("author")} required />
          {errors.author ? (
            <span className={styles.fieldError}>{errors.author}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="rating">
            Оцінка
          </label>
          <select className={styles.select} {...form.field("rating")}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="text">
          Текст відгуку
        </label>
        <textarea
          className={styles.textarea}
          {...form.field("text")}
          required
        />
        {errors.text ? (
          <span className={styles.fieldError}>{errors.text}</span>
        ) : null}
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="avatarUrl">
            Фото автора
          </label>
          <ImageField
            name="avatarUrl"
            defaultValue={values.avatarUrl}
            hint="Необов'язково."
          />
          {errors.avatarUrl ? (
            <span className={styles.fieldError}>{errors.avatarUrl}</span>
          ) : null}
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
        <Link href="/admin/reviews" className={styles.button}>
          Скасувати
        </Link>
      </div>
    </form>
  );
}

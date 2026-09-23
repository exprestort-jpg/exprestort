"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import styles from "../_components/admin.module.css";
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
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="author">
            Ім&apos;я
          </label>
          <input
            id="author"
            name="author"
            className={styles.input}
            defaultValue={values.author}
            required
          />
          {errors.author ? (
            <span className={styles.fieldError}>{errors.author}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="rating">
            Оцінка
          </label>
          <select
            id="rating"
            name="rating"
            className={styles.select}
            defaultValue={String(values.rating)}
          >
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
          id="text"
          name="text"
          className={styles.textarea}
          defaultValue={values.text}
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
          <input
            id="avatarUrl"
            name="avatarUrl"
            className={styles.input}
            defaultValue={values.avatarUrl}
            placeholder="https://…"
          />
          <span className={styles.hint}>Необов&apos;язково.</span>
          {errors.avatarUrl ? (
            <span className={styles.fieldError}>{errors.avatarUrl}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sort">
            Порядок
          </label>
          <input
            id="sort"
            name="sort"
            type="number"
            min={0}
            className={styles.input}
            defaultValue={values.sort}
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

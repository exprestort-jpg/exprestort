"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";
import styles from "../_components/admin.module.css";
import { saveCategory } from "./actions";

export type CategoryFormValues = {
  id?: number;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  sort: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
};

const initialState: FormState = {};

export function CategoryForm({ values }: { values: CategoryFormValues }) {
  const [state, formAction, pending] = useActionState(
    saveCategory,
    initialState,
  );
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  // Only a brand-new category follows the title; editing an existing slug would
  // break every link already pointing at it.
  const [slugLocked, setSlugLocked] = useState(Boolean(values.id));

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Назва
        </label>
        <input
          id="title"
          name="title"
          className={styles.input}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugLocked) setSlug(slugify(event.target.value));
          }}
          required
        />
        {errors.title ? (
          <span className={styles.fieldError}>{errors.title}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="slug">
          Адреса сторінки
        </label>
        <input
          id="slug"
          name="slug"
          className={styles.input}
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugLocked(true);
          }}
        />
        <span className={styles.hint}>
          expresstort.com.ua/catalog/{slug || "…"}
        </span>
        {errors.slug ? (
          <span className={styles.fieldError}>{errors.slug}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Опис
        </label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          defaultValue={values.description}
        />
        <span className={styles.hint}>
          Показується під заголовком на сторінці категорії.
        </span>
        {errors.description ? (
          <span className={styles.fieldError}>{errors.description}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="imageUrl">
          Фото категорії
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          className={styles.input}
          defaultValue={values.imageUrl}
          placeholder="https://…"
        />
        <span className={styles.hint}>
          Поки що посилання. Завантаження файлів — наступний крок.
        </span>
        {errors.imageUrl ? (
          <span className={styles.fieldError}>{errors.imageUrl}</span>
        ) : null}
      </div>

      <div className={styles.grid2}>
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
          <span className={styles.hint}>Менше число — вище в списку.</span>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Видимість</span>
          <label className={styles.checkboxRow} htmlFor="isActive">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={values.isActive}
            />
            <span>Показувати на сайті</span>
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoTitle">
          SEO заголовок
        </label>
        <input
          id="seoTitle"
          name="seoTitle"
          className={styles.input}
          defaultValue={values.seoTitle}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoDescription">
          SEO опис
        </label>
        <textarea
          id="seoDescription"
          name="seoDescription"
          className={styles.textarea}
          defaultValue={values.seoDescription}
        />
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={pending}
        >
          {pending ? "Зберігаємо…" : "Зберегти"}
        </button>
        <Link href="/admin/categories" className={styles.button}>
          Скасувати
        </Link>
      </div>
    </form>
  );
}

export const emptyCategory: CategoryFormValues = {
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  sort: 0,
  isActive: true,
  seoTitle: "",
  seoDescription: "",
};

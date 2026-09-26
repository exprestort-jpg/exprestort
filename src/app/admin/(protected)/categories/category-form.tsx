"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { categoryTextSchema } from "@/lib/admin-schemas";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";
import { useAdminForm } from "@/lib/use-admin-form";
import styles from "../_components/admin.module.css";
import { ImageField } from "../_components/image-field";
import { useSiteHost } from "../_components/site-host";
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
  const form = useAdminForm({
    initial: {
      title: values.title,
      slug: values.slug,
      description: values.description,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
      sort: String(values.sort),
    },
    schema: categoryTextSchema,
    state,
  });
  const [isActive, setIsActive] = useState(values.isActive);
  // Only a brand-new category follows the title; editing an existing slug would
  // break every link already pointing at it.
  const [slugLocked, setSlugLocked] = useState(Boolean(values.id));
  const siteHost = useSiteHost();

  const { errors } = form;
  const titleField = form.field("title");
  const slugField = form.field("slug");

  const rowId = state.savedId ?? values.id;

  return (
    <form action={formAction} className={styles.form}>
      {/* After a create the row id only exists in the action result; adopting
          it keeps the next save an update instead of a second insert. */}
      {rowId ? <input type="hidden" name="id" value={rowId} /> : null}

      {state.saved ? <p className={styles.savedNote}>Збережено.</p> : null}
      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Назва
        </label>
        <input
          className={styles.input}
          {...titleField}
          onChange={(event) => {
            titleField.onChange(event);
            // rowId means the row exists now, so the slug is live and must not
            // keep following the title.
            if (!slugLocked && !rowId) {
              form.setValue("slug", slugify(event.target.value));
            }
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
          className={styles.input}
          {...slugField}
          onChange={(event) => {
            slugField.onChange(event);
            setSlugLocked(true);
          }}
        />
        <span className={styles.hint}>
          {siteHost}/catalog/{form.values.slug || "…"}
        </span>
        {errors.slug ? (
          <span className={styles.fieldError}>{errors.slug}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Опис
        </label>
        <textarea className={styles.textarea} {...form.field("description")} />
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
        <ImageField name="imageUrl" defaultValue={values.imageUrl} />
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
            type="number"
            min={0}
            className={styles.input}
            {...form.field("sort")}
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
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span>Показувати на сайті</span>
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoTitle">
          SEO заголовок
        </label>
        <input className={styles.input} {...form.field("seoTitle")} />
        {errors.seoTitle ? (
          <span className={styles.fieldError}>{errors.seoTitle}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="seoDescription">
          SEO опис
        </label>
        <textarea
          className={styles.textarea}
          {...form.field("seoDescription")}
        />
        {errors.seoDescription ? (
          <span className={styles.fieldError}>{errors.seoDescription}</span>
        ) : null}
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

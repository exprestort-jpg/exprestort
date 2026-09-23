"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";
import styles from "../_components/admin.module.css";
import { RichEditor } from "../_components/rich-editor";
import { savePage } from "./actions";

export type PageFormValues = {
  id?: number;
  title: string;
  slug: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
};

export const emptyPage: PageFormValues = {
  title: "",
  slug: "",
  body: "",
  seoTitle: "",
  seoDescription: "",
};

const initialState: FormState = {};

export function PageForm({ values }: { values: PageFormValues }) {
  const [state, formAction, pending] = useActionState(savePage, initialState);
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugLocked, setSlugLocked] = useState(Boolean(values.id));

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} style={{ maxWidth: 760 }}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Заголовок
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
        <span className={styles.hint}>expresstort.com.ua/{slug || "…"}</span>
        {errors.slug ? (
          <span className={styles.fieldError}>{errors.slug}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Текст сторінки</span>
        <RichEditor name="body" defaultValue={values.body} />
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
        <Link href="/admin/pages" className={styles.button}>
          Скасувати
        </Link>
      </div>
    </form>
  );
}

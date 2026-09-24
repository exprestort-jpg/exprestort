"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { pageTextSchema } from "@/lib/admin-schemas";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";
import { useAdminForm } from "@/lib/use-admin-form";
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
  const form = useAdminForm({
    initial: {
      title: values.title,
      slug: values.slug,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
    },
    schema: pageTextSchema,
    state,
  });
  const [slugLocked, setSlugLocked] = useState(Boolean(values.id));

  const { errors } = form;
  const titleField = form.field("title");
  const slugField = form.field("slug");

  return (
    <form action={formAction} className={styles.form} style={{ maxWidth: 760 }}>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Заголовок
        </label>
        <input
          className={styles.input}
          {...titleField}
          onChange={(event) => {
            titleField.onChange(event);
            if (!slugLocked) form.setValue("slug", slugify(event.target.value));
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
          expresstort.com.ua/{form.values.slug || "…"}
        </span>
        {errors.slug ? (
          <span className={styles.fieldError}>{errors.slug}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Текст сторінки</span>
        <RichEditor name="body" defaultValue={values.body} />
        {errors.body ? (
          <span className={styles.fieldError}>{errors.body}</span>
        ) : null}
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
        <Link href="/admin/pages" className={styles.button}>
          Скасувати
        </Link>
      </div>
    </form>
  );
}

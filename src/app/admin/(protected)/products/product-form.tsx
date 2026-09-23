"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";
import styles from "../_components/admin.module.css";
import { FormSection } from "../_components/form-section";
import {
  type GalleryImage,
  ImageGalleryField,
} from "../_components/image-gallery-field";
import { saveProduct } from "./actions";

export type VariantValues = {
  label: string;
  weightLabel: string;
  price: string;
};
export type SectionValues = { title: string; body: string };

export type ProductFormValues = {
  id?: number;
  title: string;
  slug: string;
  categoryId: number | null;
  shortDescription: string;
  description: string;
  badge: string;
  setContents: string;
  isActive: boolean;
  isFeatured: boolean;
  sort: number;
  seoTitle: string;
  seoDescription: string;
  variants: VariantValues[];
  sections: SectionValues[];
  images: GalleryImage[];
};

const initialState: FormState = {};

export const emptyProduct: ProductFormValues = {
  title: "",
  slug: "",
  categoryId: null,
  shortDescription: "",
  description: "",
  badge: "",
  setContents: "",
  isActive: true,
  isFeatured: false,
  sort: 0,
  seoTitle: "",
  seoDescription: "",
  variants: [{ label: "", weightLabel: "", price: "" }],
  sections: [],
  images: [],
};

/** Suggestions only — the field stays free text so the client isn't boxed in. */
const BADGES = ["Хіт", "Новинка", "Акція"];

export function ProductForm({
  values,
  categories,
}: {
  values: ProductFormValues;
  categories: { id: number; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    saveProduct,
    initialState,
  );
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugLocked, setSlugLocked] = useState(Boolean(values.id));
  const [variants, setVariants] = useState<VariantValues[]>(values.variants);
  const [sections, setSections] = useState<SectionValues[]>(values.sections);

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
          expresstort.com.ua/product/{slug || "…"}
        </span>
        {errors.slug ? (
          <span className={styles.fieldError}>{errors.slug}</span>
        ) : null}
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoryId">
            Категорія
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className={styles.select}
            defaultValue={values.categoryId ?? ""}
            required
          >
            <option value="" disabled>
              Оберіть категорію
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
          {errors.categoryId ? (
            <span className={styles.fieldError}>{errors.categoryId}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="badge">
            Позначка на картці
          </label>
          <input
            id="badge"
            name="badge"
            className={styles.input}
            defaultValue={values.badge}
            list="badge-options"
            placeholder="Без позначки"
          />
          <datalist id="badge-options">
            {BADGES.map((badge) => (
              <option key={badge} value={badge} />
            ))}
          </datalist>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="shortDescription">
          Короткий опис
        </label>
        <input
          id="shortDescription"
          name="shortDescription"
          className={styles.input}
          defaultValue={values.shortDescription}
        />
        <span className={styles.hint}>
          Один рядок під назвою на картці товару.
        </span>
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
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="setContents">
          Склад набору
        </label>
        <textarea
          id="setContents"
          name="setContents"
          className={styles.textarea}
          defaultValue={values.setContents}
          placeholder={"Коржі 10 шт\nПосипка\nПідложка для торта"}
        />
        <span className={styles.hint}>
          По одному пункту в рядку. Порожньо — блок не показується.
        </span>
      </div>

      <FormSection
        title="Фото товару"
        hint="Перше фото стає головним на картці товару."
      >
        <ImageGalleryField defaultValue={values.images} />
      </FormSection>

      <FormSection title="Розміри та ціни">
        {variants.map((variant, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id until saved
          <div key={index} className={styles.repeaterRow}>
            <div className={styles.field}>
              <input
                name={`variant.${index}.label`}
                className={styles.input}
                defaultValue={variant.label}
                placeholder="Ø 20 см"
                aria-label="Розмір"
              />
              {errors[`variants.${index}.label`] ? (
                <span className={styles.fieldError}>
                  {errors[`variants.${index}.label`]}
                </span>
              ) : null}
            </div>
            <input
              name={`variant.${index}.weightLabel`}
              className={styles.input}
              defaultValue={variant.weightLabel}
              placeholder="600–650 г"
              aria-label="Вага"
            />
            <div className={styles.field}>
              <input
                name={`variant.${index}.price`}
                className={styles.input}
                defaultValue={variant.price}
                placeholder="450"
                inputMode="decimal"
                aria-label="Ціна, ₴"
              />
              {errors[`variant.${index}.price`] ? (
                <span className={styles.fieldError}>
                  {errors[`variant.${index}.price`]}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() =>
                setVariants(variants.filter((_, i) => i !== index))
              }
              disabled={variants.length === 1}
            >
              Прибрати
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.addButton}
          onClick={() =>
            setVariants([
              ...variants,
              { label: "", weightLabel: "", price: "" },
            ])
          }
        >
          + Додати розмір
        </button>
      </FormSection>

      <FormSection
        title="Розділи на сторінці товару"
        hint="Наприклад «Склад» або «Доставка та зберігання»."
      >
        {sections.map((section, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id until saved
          <div key={index} className={styles.repeaterStack}>
            <div className={styles.repeaterHead}>
              <input
                name={`section.${index}.title`}
                className={styles.input}
                defaultValue={section.title}
                placeholder="Склад"
                aria-label="Заголовок розділу"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={styles.iconButton}
                onClick={() =>
                  setSections(sections.filter((_, i) => i !== index))
                }
              >
                Прибрати
              </button>
            </div>
            <textarea
              name={`section.${index}.body`}
              className={styles.textarea}
              defaultValue={section.body}
              placeholder="Текст розділу"
              aria-label="Текст розділу"
            />
          </div>
        ))}

        <button
          type="button"
          className={styles.addButton}
          onClick={() => setSections([...sections, { title: "", body: "" }])}
        >
          + Додати розділ
        </button>
      </FormSection>

      <FormSection title="Публікація">
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
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Показ</span>
            <label className={styles.checkboxRow} htmlFor="isActive">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                defaultChecked={values.isActive}
              />
              <span>Показувати на сайті</span>
            </label>
            <label className={styles.checkboxRow} htmlFor="isFeatured">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                defaultChecked={values.isFeatured}
              />
              <span>Закріпити в «Популярне»</span>
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
      </FormSection>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={pending}
        >
          {pending ? "Зберігаємо…" : "Зберегти"}
        </button>
        <Link href="/admin/products" className={styles.button}>
          Скасувати
        </Link>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  productTextSchema,
  sectionRowSchema,
  variantRowSchema,
} from "@/lib/admin-schemas";
import type { FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";
import { fieldError, useAdminForm } from "@/lib/use-admin-form";
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
  const form = useAdminForm({
    initial: {
      title: values.title,
      slug: values.slug,
      shortDescription: values.shortDescription,
      description: values.description,
      badge: values.badge,
      setContents: values.setContents,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
      categoryId: values.categoryId === null ? "" : String(values.categoryId),
      sort: String(values.sort),
    },
    schema: productTextSchema,
    state,
  });
  const [slugLocked, setSlugLocked] = useState(Boolean(values.id));
  const [variants, setVariants] = useState<VariantValues[]>(values.variants);
  const [sections, setSections] = useState<SectionValues[]>(values.sections);
  const [isActive, setIsActive] = useState(values.isActive);
  const [isFeatured, setIsFeatured] = useState(values.isFeatured);

  const { errors, setError } = form;
  const titleField = form.field("title");
  const slugField = form.field("slug");

  /*
   * Repeater rows are validated by hand: their keys carry an index, so they
   * cannot come from the object schema the rest of the form uses. Same rule as
   * everywhere else — while typing, re-check only a field that already errors.
   */
  function updateRow<T extends Record<string, string>>(
    rows: T[],
    setRows: (next: T[]) => void,
    prefix: "variants" | "sections",
    rowSchema: typeof variantRowSchema | typeof sectionRowSchema,
    index: number,
    key: keyof T & string,
    value: string,
    force = false,
  ) {
    const next = [...rows];
    next[index] = { ...next[index], [key]: value };
    setRows(next);

    const errorKey = `${prefix}.${index}.${key}`;
    if (force || errors[errorKey]) {
      setError(errorKey, fieldError(rowSchema, key, value));
    }
  }

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
          expresstort.com.ua/product/{form.values.slug || "…"}
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
            className={styles.select}
            {...form.field("categoryId")}
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
            className={styles.input}
            {...form.field("badge")}
            list="badge-options"
            placeholder="Без позначки"
          />
          <datalist id="badge-options">
            {BADGES.map((badge) => (
              <option key={badge} value={badge} />
            ))}
          </datalist>
          {errors.badge ? (
            <span className={styles.fieldError}>{errors.badge}</span>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="shortDescription">
          Короткий опис
        </label>
        <input className={styles.input} {...form.field("shortDescription")} />
        <span className={styles.hint}>
          Один рядок під назвою на картці товару.
        </span>
        {errors.shortDescription ? (
          <span className={styles.fieldError}>{errors.shortDescription}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Опис
        </label>
        <textarea className={styles.textarea} {...form.field("description")} />
        {errors.description ? (
          <span className={styles.fieldError}>{errors.description}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="setContents">
          Склад набору
        </label>
        <textarea
          className={styles.textarea}
          {...form.field("setContents")}
          placeholder={"Коржі 10 шт\nПосипка\nПідложка для торта"}
        />
        <span className={styles.hint}>
          По одному пункту в рядку. Порожньо — блок не показується.
        </span>
        {errors.setContents ? (
          <span className={styles.fieldError}>{errors.setContents}</span>
        ) : null}
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
                value={variant.label}
                onChange={(event) =>
                  updateRow(
                    variants,
                    setVariants,
                    "variants",
                    variantRowSchema,
                    index,
                    "label",
                    event.target.value,
                  )
                }
                onBlur={(event) =>
                  updateRow(
                    variants,
                    setVariants,
                    "variants",
                    variantRowSchema,
                    index,
                    "label",
                    event.target.value,
                    true,
                  )
                }
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
              value={variant.weightLabel}
              onChange={(event) =>
                updateRow(
                  variants,
                  setVariants,
                  "variants",
                  variantRowSchema,
                  index,
                  "weightLabel",
                  event.target.value,
                )
              }
              placeholder="600–650 г"
              aria-label="Вага"
            />
            <div className={styles.field}>
              <input
                name={`variant.${index}.price`}
                className={styles.input}
                value={variant.price}
                onChange={(event) =>
                  updateRow(
                    variants,
                    setVariants,
                    "variants",
                    variantRowSchema,
                    index,
                    "price",
                    event.target.value,
                  )
                }
                onBlur={(event) =>
                  updateRow(
                    variants,
                    setVariants,
                    "variants",
                    variantRowSchema,
                    index,
                    "price",
                    event.target.value,
                    true,
                  )
                }
                placeholder="450"
                inputMode="decimal"
                aria-label="Ціна, ₴"
              />
              {errors[`variants.${index}.price`] ? (
                <span className={styles.fieldError}>
                  {errors[`variants.${index}.price`]}
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
                value={section.title}
                onChange={(event) =>
                  updateRow(
                    sections,
                    setSections,
                    "sections",
                    sectionRowSchema,
                    index,
                    "title",
                    event.target.value,
                  )
                }
                onBlur={(event) =>
                  updateRow(
                    sections,
                    setSections,
                    "sections",
                    sectionRowSchema,
                    index,
                    "title",
                    event.target.value,
                    true,
                  )
                }
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
            {errors[`sections.${index}.title`] ? (
              <span className={styles.fieldError}>
                {errors[`sections.${index}.title`]}
              </span>
            ) : null}
            <textarea
              name={`section.${index}.body`}
              className={styles.textarea}
              value={section.body}
              onChange={(event) =>
                updateRow(
                  sections,
                  setSections,
                  "sections",
                  sectionRowSchema,
                  index,
                  "body",
                  event.target.value,
                )
              }
              onBlur={(event) =>
                updateRow(
                  sections,
                  setSections,
                  "sections",
                  sectionRowSchema,
                  index,
                  "body",
                  event.target.value,
                  true,
                )
              }
              placeholder="Текст розділу"
              aria-label="Текст розділу"
            />
            {errors[`sections.${index}.body`] ? (
              <span className={styles.fieldError}>
                {errors[`sections.${index}.body`]}
              </span>
            ) : null}
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
              type="number"
              min={0}
              className={styles.input}
              {...form.field("sort")}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Показ</span>
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
            <label className={styles.checkboxRow} htmlFor="isFeatured">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              <span>Закріпити в «Популярне»</span>
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

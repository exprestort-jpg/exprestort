"use client";

import { useActionState } from "react";
import { settingsTextSchema } from "@/lib/admin-schemas";
import type { FormState } from "@/lib/form";
import { useAdminForm } from "@/lib/use-admin-form";
import styles from "../_components/admin.module.css";
import { FormSection } from "../_components/form-section";
import { ImageField } from "../_components/image-field";
import { saveSettings } from "./actions";

export type SettingsValues = {
  phone: string;
  workingHours: string;
  promoStripText: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroScript: string;
  heroImageUrl: string;
  aboutTitle: string;
  aboutText: string;
  aboutBullets: string;
  aboutImageUrl: string;
};

const initialState: FormState = {};

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction, pending] = useActionState(
    saveSettings,
    initialState,
  );
  /*
   * The two image URLs stay out of the hook: ImageField owns them in its own
   * state and submits them through a hidden input.
   */
  const form = useAdminForm({
    initial: {
      phone: values.phone,
      workingHours: values.workingHours,
      promoStripText: values.promoStripText,
      heroTitle: values.heroTitle,
      heroTitleAccent: values.heroTitleAccent,
      heroSubtitle: values.heroSubtitle,
      heroScript: values.heroScript,
      aboutTitle: values.aboutTitle,
      aboutText: values.aboutText,
      aboutBullets: values.aboutBullets,
    },
    schema: settingsTextSchema,
    state,
  });
  const { errors } = form;

  return (
    <form action={formAction} className={styles.form}>
      {state.saved ? <p className={styles.savedNote}>Збережено.</p> : null}
      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <FormSection title="Контакти">
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Телефон
            </label>
            <input className={styles.input} {...form.field("phone")} required />
            {errors.phone ? (
              <span className={styles.fieldError}>{errors.phone}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="workingHours">
              Графік роботи
            </label>
            <input
              className={styles.input}
              {...form.field("workingHours")}
              placeholder="Пн–Нд, 9:00–20:00"
            />
            {errors.workingHours ? (
              <span className={styles.fieldError}>{errors.workingHours}</span>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Смужка над шапкою">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="promoStripText">
            Текст
          </label>
          <input className={styles.input} {...form.field("promoStripText")} />
          <span className={styles.hint}>
            Помаранчевий рядок у самому верху сайту.
          </span>
          {errors.promoStripText ? (
            <span className={styles.fieldError}>{errors.promoStripText}</span>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Головний банер">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="heroTitle">
            Заголовок
          </label>
          <input className={styles.input} {...form.field("heroTitle")} />
          {errors.heroTitle ? (
            <span className={styles.fieldError}>{errors.heroTitle}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="heroTitleAccent">
            Друга частина заголовка
          </label>
          <input className={styles.input} {...form.field("heroTitleAccent")} />
          <span className={styles.hint}>Виділяється помаранчевим.</span>
          {errors.heroTitleAccent ? (
            <span className={styles.fieldError}>{errors.heroTitleAccent}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="heroSubtitle">
            Підзаголовок
          </label>
          <textarea
            className={styles.textarea}
            {...form.field("heroSubtitle")}
          />
          {errors.heroSubtitle ? (
            <span className={styles.fieldError}>{errors.heroSubtitle}</span>
          ) : null}
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="heroScript">
              Напис від руки
            </label>
            <input
              className={styles.input}
              {...form.field("heroScript")}
              placeholder="Смачні торти — це просто!"
            />
            {errors.heroScript ? (
              <span className={styles.fieldError}>{errors.heroScript}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="heroImageUrl">
              Фото банера
            </label>
            <ImageField
              name="heroImageUrl"
              defaultValue={values.heroImageUrl}
            />
            {errors.heroImageUrl ? (
              <span className={styles.fieldError}>{errors.heroImageUrl}</span>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Блок «Про нас» на головній">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="aboutTitle">
            Заголовок
          </label>
          <input className={styles.input} {...form.field("aboutTitle")} />
          {errors.aboutTitle ? (
            <span className={styles.fieldError}>{errors.aboutTitle}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="aboutText">
            Текст
          </label>
          <textarea className={styles.textarea} {...form.field("aboutText")} />
          {errors.aboutText ? (
            <span className={styles.fieldError}>{errors.aboutText}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="aboutBullets">
            Список переваг
          </label>
          <textarea
            className={styles.textarea}
            {...form.field("aboutBullets")}
          />
          <span className={styles.hint}>По одному пункту в рядку.</span>
          {errors.aboutBullets ? (
            <span className={styles.fieldError}>{errors.aboutBullets}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="aboutImageUrl">
            Фото
          </label>
          <ImageField
            name="aboutImageUrl"
            defaultValue={values.aboutImageUrl}
          />
          {errors.aboutImageUrl ? (
            <span className={styles.fieldError}>{errors.aboutImageUrl}</span>
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
      </div>
    </form>
  );
}

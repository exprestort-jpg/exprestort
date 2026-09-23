"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import styles from "../_components/admin.module.css";
import { FormSection } from "../_components/form-section";
import { ImageField } from "../_components/image-field";
import { saveSettings } from "./actions";

export type SettingsValues = {
  phone: string;
  workingHours: string;
  promoStripText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroScript: string;
  heroImageUrl: string;
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl: string;
};

const initialState: FormState = {};

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction, pending] = useActionState(
    saveSettings,
    initialState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form}>
      {state.saved ? <p className={styles.savedNote}>Збережено.</p> : null}

      <FormSection title="Контакти">
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              name="phone"
              className={styles.input}
              defaultValue={values.phone}
              required
            />
            {errors.phone ? (
              <span className={styles.fieldError}>{errors.phone}</span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="workingHours">
              Графік роботи
            </label>
            <input
              id="workingHours"
              name="workingHours"
              className={styles.input}
              defaultValue={values.workingHours}
              placeholder="Пн–Нд, 9:00–20:00"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Смужка над шапкою">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="promoStripText">
            Текст
          </label>
          <input
            id="promoStripText"
            name="promoStripText"
            className={styles.input}
            defaultValue={values.promoStripText}
          />
          <span className={styles.hint}>
            Помаранчевий рядок у самому верху сайту.
          </span>
        </div>
      </FormSection>

      <FormSection title="Головний банер">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="heroTitle">
            Заголовок
          </label>
          <input
            id="heroTitle"
            name="heroTitle"
            className={styles.input}
            defaultValue={values.heroTitle}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="heroSubtitle">
            Підзаголовок
          </label>
          <textarea
            id="heroSubtitle"
            name="heroSubtitle"
            className={styles.textarea}
            defaultValue={values.heroSubtitle}
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="heroScript">
              Напис від руки
            </label>
            <input
              id="heroScript"
              name="heroScript"
              className={styles.input}
              defaultValue={values.heroScript}
              placeholder="Смачні торти — це просто!"
            />
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
          <input
            id="aboutTitle"
            name="aboutTitle"
            className={styles.input}
            defaultValue={values.aboutTitle}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="aboutText">
            Текст
          </label>
          <textarea
            id="aboutText"
            name="aboutText"
            className={styles.textarea}
            defaultValue={values.aboutText}
          />
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

"use client";

import { useId, useState } from "react";
import styles from "./image-field.module.css";
import { useUpload } from "./use-upload";

/**
 * One optional image. The URL lives in a hidden input so the surrounding server
 * action reads it like any other field; the file itself goes straight to Blob.
 */
export function ImageField({
  name,
  defaultValue,
  hint,
}: {
  name: string;
  defaultValue: string;
  hint?: string;
}) {
  const inputId = useId();
  const [url, setUrl] = useState(defaultValue);
  const { uploadFiles, pending, error } = useUpload();

  return (
    <div className={styles.field}>
      <input type="hidden" name={name} value={url} />

      <div className={styles.row}>
        {url ? (
          // Not next/image: the URL is arbitrary until saved, and this is a
          // 96px admin thumbnail that gains nothing from optimisation.
          // biome-ignore lint/performance/noImgElement: admin-only preview
          <img src={url} alt="" className={styles.preview} />
        ) : (
          <div className={styles.placeholder}>Немає фото</div>
        )}

        <div className={styles.controls}>
          <label className={styles.fileButton} htmlFor={inputId}>
            {pending ? "Завантажуємо…" : url ? "Замінити" : "Завантажити"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className={styles.fileInput}
            disabled={pending}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              // Reset so picking the same file twice still fires a change.
              event.target.value = "";
              if (!file) return;
              const [uploaded] = await uploadFiles([file]);
              if (uploaded) setUrl(uploaded);
            }}
          />

          {url ? (
            <button
              type="button"
              className={styles.remove}
              onClick={() => setUrl("")}
            >
              Прибрати
            </button>
          ) : null}
        </div>
      </div>

      {hint ? (
        <span
          className={styles.error}
          style={{ color: "var(--text-secondary)" }}
        >
          {hint}
        </span>
      ) : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}

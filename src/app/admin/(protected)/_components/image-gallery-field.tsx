"use client";

import { useId, useState } from "react";
import styles from "./image-field.module.css";
import { useUpload } from "./use-upload";

export type GalleryImage = { url: string; alt: string };

/**
 * Ordered product gallery. Submits as image.N.url / image.N.alt, matching how
 * the product action already reads variants and sections.
 */
export function ImageGalleryField({
  defaultValue,
}: {
  defaultValue: GalleryImage[];
}) {
  const inputId = useId();
  const [images, setImages] = useState<GalleryImage[]>(defaultValue);
  const { uploadFiles, pending, error } = useUpload();

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  }

  return (
    <div className={styles.field}>
      {images.length > 0 ? (
        <div className={styles.gallery}>
          {images.map((image, index) => (
            <div key={image.url} className={styles.galleryItem}>
              {/* biome-ignore lint/performance/noImgElement: admin-only thumbnail */}
              <img src={image.url} alt="" className={styles.galleryThumb} />

              <input
                type="hidden"
                name={`image.${index}.url`}
                value={image.url}
              />

              <div className={styles.galleryBody}>
                <input
                  name={`image.${index}.alt`}
                  defaultValue={image.alt}
                  placeholder="Опис фото для пошукових систем"
                  aria-label="Опис фото"
                  style={{
                    padding: "7px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-sm)",
                    background: "var(--surface)",
                    fontSize: 13,
                  }}
                  onChange={(event) => {
                    const next = [...images];
                    next[index] = { ...next[index], alt: event.target.value };
                    setImages(next);
                  }}
                />
                <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                  {index === 0 ? "Головне фото" : `Фото ${index + 1}`}
                </span>
              </div>

              <div className={styles.galleryActions}>
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Вище"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  title="Нижче"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.miniButton}
                  onClick={() =>
                    setImages(images.filter((_, i) => i !== index))
                  }
                  style={{ color: "var(--accent-strong)" }}
                >
                  Прибрати
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.controls}>
        <label className={styles.fileButton} htmlFor={inputId}>
          {pending ? "Завантажуємо…" : "+ Додати фото"}
        </label>
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className={styles.fileInput}
          disabled={pending}
          onChange={async (event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            if (files.length === 0) return;
            const urls = await uploadFiles(files);
            setImages((current) => [
              ...current,
              ...urls.map((url) => ({ url, alt: "" })),
            ]);
          }}
        />
      </div>

      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}

"use client";

import { ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import { formatPrice } from "@/lib/money";
import styles from "./product.module.css";

export type ProductVariantView = {
  id: number;
  label: string;
  weightLabel: string | null;
  priceKop: number;
};

export type ProductImageView = { url: string; alt: string | null };

export type ProductSectionView = { id: number; title: string; body: string };

/**
 * Gallery, size picker and accordions share one client component: choosing a
 * size has to drive the price shown next to the cart button, so splitting them
 * would just mean lifting the same state one level up.
 */
export function ProductDetail({
  title,
  images,
  variants,
  sections,
  children,
}: {
  title: string;
  images: ProductImageView[];
  variants: ProductVariantView[];
  sections: ProductSectionView[];
  /** Title, description and «Склад набору», rendered between the thumbs and
   *  the size picker to match the design. Server-rendered by the page. */
  children: ReactNode;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeVariantId, setActiveVariantId] = useState(
    variants[0]?.id ?? null,
  );
  const [openSection, setOpenSection] = useState<number | null>(
    sections[0]?.id ?? null,
  );

  const current = images[activeImage];

  return (
    <>
      <div className={styles.gallery}>
        {current ? (
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            priority
            sizes="(min-width: 768px) 1200px, 100vw"
            style={{ objectFit: "cover" }}
          />
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className={styles.thumbs}>
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              className={`${styles.thumb} ${index === activeImage ? styles.thumbActive : ""}`}
              onClick={() => setActiveImage(index)}
              aria-label={`Фото ${index + 1}`}
              aria-current={index === activeImage}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="82px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      ) : null}

      {children}

      {variants.length > 0 ? (
        <>
          <p className={styles.sizeHeader}>Оберіть розмір:</p>
          <div className={styles.sizes}>
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={`${styles.size} ${
                  variant.id === activeVariantId ? styles.sizeActive : ""
                }`}
                onClick={() => setActiveVariantId(variant.id)}
                aria-pressed={variant.id === activeVariantId}
              >
                <span className={styles.sizeLabel}>{variant.label}</span>
                {variant.weightLabel ? (
                  <span className={styles.sizeWeight}>
                    {variant.weightLabel}
                  </span>
                ) : null}
                <span className={styles.sizePrice}>
                  {formatPrice(variant.priceKop)}
                </span>
              </button>
            ))}
          </div>

          <button type="button" className="buttonPrimary buttonBlock" disabled>
            <ShoppingCart size={17} strokeWidth={2} aria-hidden />
            Додати в кошик
          </button>
        </>
      ) : null}

      {sections.length > 0 ? (
        <div className={styles.accordions}>
          {sections.map((section) => {
            const open = section.id === openSection;
            return (
              <div
                key={section.id}
                className={`${styles.accordion} ${open ? styles.accordionOpen : ""}`}
              >
                <button
                  type="button"
                  className={styles.accordionHead}
                  onClick={() => setOpenSection(open ? null : section.id)}
                  aria-expanded={open}
                >
                  {section.title}
                  {open ? (
                    <ChevronUp
                      size={18}
                      className={styles.accordionIcon}
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                      className={styles.accordionIcon}
                      aria-hidden
                    />
                  )}
                </button>
                {open ? (
                  <div className={styles.accordionBody}>{section.body}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

"use client";

import { ChevronRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./chrome.module.css";

export type MenuCategory = {
  slug: string;
  title: string;
  productCount: number;
};

/**
 * Client component only because of the slide-out menu. Categories and the phone
 * are passed in from the cached server layout, so opening the menu costs no
 * request.
 */
export function SiteHeader({
  categories,
  phone,
}: {
  categories: MenuCategory[];
  phone: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerSide}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setOpen(true)}
            aria-label="Відкрити меню"
            aria-expanded={open}
          >
            <Menu size={24} strokeWidth={1.75} />
          </button>
        </div>

        <Link href="/" className={styles.logo}>
          <span className={styles.logoName}>Експрес-торт</span>
          <span className={styles.logoTagline}>КРАФТОВІ КОРЖІ</span>
        </Link>

        <div className={`${styles.headerSide} ${styles.headerSideEnd}`}>
          <Link href="/search" className={styles.iconButton} aria-label="Пошук">
            <Search size={22} strokeWidth={1.75} />
          </Link>
          <Link href="/cart" className={styles.iconButton} aria-label="Кошик">
            <span className={styles.cartWrap}>
              <ShoppingBag size={24} strokeWidth={1.75} />
            </span>
          </Link>
        </div>
      </header>

      {open ? (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop, Escape and the close button both dismiss */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users get Escape and the close button */}
          <div className={styles.menuOverlay} onClick={() => setOpen(false)} />
          {/* biome-ignore lint/a11y/noStaticElementInteractions: closes the panel when a link inside it is followed */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: links handle their own keyboard activation */}
          <nav
            className={styles.menuPanel}
            aria-label="Головне меню"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <div className={styles.menuTop}>
              <span className={styles.logoName}>Меню</span>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setOpen(false)}
                aria-label="Закрити меню"
              >
                <X size={24} strokeWidth={1.75} />
              </button>
            </div>

            <div className={styles.menuRows}>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/catalog/${category.slug}`}
                  className={styles.menuRow}
                >
                  <span className={styles.menuRowLeft}>
                    <span className={styles.menuRowLabel}>
                      {category.title}
                    </span>
                    <span className={styles.menuRowCount}>
                      {category.productCount}
                    </span>
                  </span>
                  <ChevronRight size={18} className={styles.menuChevron} />
                </Link>
              ))}
            </div>

            <div className={styles.menuLinks}>
              <Link href="/about" className={styles.menuLink}>
                Про нас
              </Link>
              <Link href="/offer" className={styles.menuLink}>
                Публічна оферта
              </Link>
              <Link href="/privacy" className={styles.menuLink}>
                Політика конфіденційності
              </Link>
            </div>

            <div className={styles.menuBottom}>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className={styles.menuPhone}
                >
                  {phone}
                </a>
              ) : null}
              <a
                href="https://t.me/expressTort"
                target="_blank"
                rel="noopener noreferrer"
                className="buttonPrimary"
              >
                Написати в Telegram
              </a>
            </div>
          </nav>
        </>
      ) : null}
    </>
  );
}

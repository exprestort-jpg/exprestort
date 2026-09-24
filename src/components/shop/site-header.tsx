"use client";

import { ChevronRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/lib/cart-store";
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
  /*
   * The drawer has to outlive `open` to play its slide-out, so closing is a
   * state of its own. The panel unmounts on animationend — under
   * prefers-reduced-motion the animation is 1ms rather than `none`, precisely
   * so that event still fires and the drawer cannot get stuck on screen.
   */
  const [closing, setClosing] = useState(false);
  const mounted = open || closing;
  // Read after hydration only: the server has no localStorage, so rendering the
  // real count straight away would mismatch and get wiped by React.
  const hydrated = useCart((state) => state.hydrated);
  const count = useCart((state) => cartCount(state.lines));

  const closeMenu = () => {
    setOpen(false);
    setClosing(true);
  };

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      // The setters are stable, so the effect stays keyed on `mounted` alone.
      if (event.key === "Escape") {
        setOpen(false);
        setClosing(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerSide}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              setClosing(false);
              setOpen(true);
            }}
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
          <Link
            href="/cart"
            className={styles.iconButton}
            aria-label={count > 0 ? `Кошик, товарів: ${count}` : "Кошик"}
          >
            <span className={styles.cartWrap}>
              <ShoppingBag size={24} strokeWidth={1.75} />
              {hydrated && count > 0 ? (
                <span className={styles.cartBadge}>{count}</span>
              ) : null}
            </span>
          </Link>
        </div>
      </header>

      {mounted ? (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop, Escape and the close button both dismiss */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users get Escape and the close button */}
          <div
            className={`${styles.menuOverlay} ${closing ? styles.menuOverlayClosing : ""}`}
            onClick={closeMenu}
          />
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: links handle their own keyboard activation */}
          <nav
            className={`${styles.menuPanel} ${closing ? styles.menuPanelClosing : ""}`}
            aria-label="Головне меню"
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && closing) {
                setClosing(false);
              }
            }}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) closeMenu();
            }}
          >
            <div className={styles.menuTop}>
              <span className={styles.logoName}>Меню</span>
              <button
                type="button"
                className={styles.iconButton}
                onClick={closeMenu}
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

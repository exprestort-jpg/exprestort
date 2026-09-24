"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./carousel.module.css";

/**
 * Horizontal slider shared by the home sections. Touch and trackpad scroll the
 * track natively; a mouse gets click-drag plus the arrow buttons, because a
 * vertical wheel does nothing on a horizontal scroller and hijacking it would
 * trap the page scroll.
 *
 * `slideWidth` is any CSS length — it lands on the track as a custom property
 * and every direct child is sized from it, so the row looks the same whether
 * the section has three items or thirty.
 */
export function Carousel({
  children,
  slideWidth,
  label,
  stackOnMobile = false,
}: {
  children: ReactNode;
  slideWidth: string;
  label: string;
  /** Below 768px, drop the slider and stack the items in one column. */
  stackOnMobile?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: 0,
  });
  const [dragging, setDragging] = useState(false);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const max = track.scrollWidth - track.clientWidth;
    setCanPrev(track.scrollLeft > 1);
    setCanNext(track.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, [sync]);

  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    const track = trackRef.current;
    if (!track) {
      return;
    }
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: 0,
    };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag.active || !track) {
      return;
    }
    const delta = event.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(delta));
    track.scrollLeft = drag.startScroll - delta;
  };

  const endDrag = () => {
    if (!dragRef.current.active) {
      return;
    }
    dragRef.current.active = false;
    setDragging(false);
  };

  /* A drag that ends on a card would otherwise open it — swallow that click. */
  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved > 8) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = 0;
    }
  };

  return (
    <div className={`${styles.root} ${stackOnMobile ? styles.stacked : ""}`}>
      <div className={styles.viewport}>
        {/* A labelled <section>, so the focusable scroll box is announced. */}
        <section
          ref={trackRef}
          className={`${styles.track} ${dragging ? styles.dragging : ""}`}
          style={{ "--slide": slideWidth } as React.CSSProperties}
          onScroll={sync}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onClickCapture={onClickCapture}
          aria-label={label}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable box must be keyboard-reachable (WCAG 2.1.1)
          tabIndex={0}
        >
          {children}
        </section>
      </div>

      {canPrev || canNext ? (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={() => page(-1)}
            disabled={!canPrev}
            aria-label="Попередні"
          >
            <ChevronLeft size={20} strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => page(1)}
            disabled={!canNext}
            aria-label="Наступні"
          >
            <ChevronRight size={20} strokeWidth={2.5} aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}

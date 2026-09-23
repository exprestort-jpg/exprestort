"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./cart.module.css";

export type ComboOption = { ref: string; name: string };

/**
 * Autocomplete with full keyboard control: ArrowUp/ArrowDown move the
 * highlight, Enter picks it, Escape closes. Built on the ARIA combobox pattern
 * so screen readers announce the active option rather than silently swapping
 * text under the cursor.
 */
export function ComboBox({
  id,
  label,
  placeholder,
  disabled = false,
  required = false,
  query,
  onQueryChange,
  selected,
  onSelect,
  options,
  loading,
  manual,
  manualHint,
  minLength,
  error,
}: {
  id: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  selected: ComboOption | null;
  onSelect: (option: ComboOption) => void;
  options: ComboOption[];
  loading: boolean;
  manual: boolean;
  manualHint: string;
  minLength: number;
  error?: string;
}) {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [closed, setClosed] = useState(false);
  const [focused, setFocused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  /*
   * Focus is part of the condition because the branch field uses minLength 0 —
   * without it the list would hang open permanently, and show "нічого не
   * знайдено" while the customer is still choosing a city.
   */
  const open =
    !disabled &&
    !selected &&
    !closed &&
    focused &&
    query.trim().length >= minLength;

  // A new result set invalidates whatever was highlighted before.
  useEffect(() => setActiveIndex(0), [options]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !item) return;

    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;

    if (itemTop < list.scrollTop) {
      list.scrollTop = itemTop;
    } else if (itemBottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = itemBottom - list.clientHeight;
    }
  }, [open, activeIndex]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setClosed(true);
      return;
    }

    if (!open || options.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Enter") {
      // Without this the form would submit on the first Enter.
      event.preventDefault();
      const option = options[activeIndex];
      if (option) onSelect(option);
    }
  }

  return (
    <div className={`${styles.field} ${styles.combo}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        value={selected ? selected.name : query}
        onChange={(event) => {
          setClosed(false);
          onQueryChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setClosed(false);
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options[activeIndex] ? `${listId}-${activeIndex}` : undefined
        }
      />

      {open ? (
        <div
          className={styles.options}
          id={listId}
          role="listbox"
          ref={listRef}
          // Blur fires before click, which would close the list and swallow the
          // selection. Preventing the default keeps focus on the input.
          onMouseDown={(event) => event.preventDefault()}
        >
          {manual ? (
            <p className={styles.comboHint}>{manualHint}</p>
          ) : loading ? (
            <p className={styles.comboHint}>Шукаємо…</p>
          ) : options.length === 0 ? (
            <p className={styles.comboHint}>Нічого не знайдено</p>
          ) : (
            options.map((option, index) => (
              <button
                key={option.ref}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                data-active={index === activeIndex}
                className={`${styles.option} ${index === activeIndex ? styles.optionActive : ""}`}
                // Mouse move rather than hover state, so pointer and keyboard
                // never disagree about which option is active.
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => onSelect(option)}
              >
                {option.name}
              </button>
            ))
          )}
        </div>
      ) : null}

      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}

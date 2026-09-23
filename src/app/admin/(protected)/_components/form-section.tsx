import type { ReactNode } from "react";
import styles from "./admin.module.css";

/**
 * A titled group inside an admin form. Deliberately a <section> with a heading
 * rather than <fieldset>/<legend>: the browser cuts a notch out of a fieldset's
 * border for the legend, which breaks the divider, and these are visual
 * groupings of independently-labelled inputs, not radio/checkbox groups.
 */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {children}
    </section>
  );
}

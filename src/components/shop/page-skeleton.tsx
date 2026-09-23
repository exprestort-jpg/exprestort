import styles from "./product.module.css";

/** Shown while a route whose params were not prerendered streams in. */
export function PageSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden>
      <div className={styles.skeletonBlock} style={{ width: "40%" }} />
      <div className={`${styles.skeletonBlock} ${styles.skeletonBlockWide}`} />
      <div className={styles.skeletonBlock} style={{ width: "70%" }} />
      <div className={styles.skeletonBlock} style={{ width: "55%" }} />
    </div>
  );
}

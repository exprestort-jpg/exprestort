import { ChevronRight } from "lucide-react";
import Link from "next/link";
import styles from "./catalog.module.css";

export function Breadcrumbs({
  trail,
}: {
  trail: { href?: string; label: string }[];
}) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Хлібні крихти">
      {trail.map((item, index) => (
        <span key={item.label} className={styles.breadcrumbs}>
          {index > 0 ? (
            <ChevronRight size={13} className={styles.crumbSep} aria-hidden />
          ) : null}
          {item.href ? (
            <Link href={item.href} className={styles.crumb}>
              {item.label}
            </Link>
          ) : (
            <span className={styles.crumbCurrent}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

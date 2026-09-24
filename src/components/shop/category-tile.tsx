import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./catalog.module.css";

export function CategoryTile({
  category,
}: {
  category: { slug: string; title: string; imageUrl: string | null };
}) {
  return (
    <Link href={`/catalog/${category.slug}`} className={styles.tile}>
      {category.imageUrl ? (
        <Image
          src={category.imageUrl}
          alt={category.title}
          fill
          sizes="(min-width: 768px) 200px, 50vw"
          className={styles.tileImage}
        />
      ) : null}
      <div className={styles.tileOverlay}>
        <span className={styles.tileLabel}>{category.title}</span>
        <span className={styles.tileArrow} aria-hidden>
          <ArrowRight size={14} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

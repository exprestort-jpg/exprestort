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
      <div className={styles.tilePhoto}>
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.title}
            fill
            sizes="(min-width: 768px) 200px, 33vw"
            style={{ objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div className={styles.tileBottom}>
        <span className={styles.tileLabel}>{category.title}</span>
        <span className={styles.tileArrow} aria-hidden>
          <ArrowRight size={13} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

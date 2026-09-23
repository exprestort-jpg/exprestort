import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import styles from "./catalog.module.css";

export type ProductRowData = {
  slug: string;
  title: string;
  shortDescription: string | null;
  badge: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  minPriceKop: number | null;
};

export function ProductRow({
  product,
  sizes,
}: {
  product: ProductRowData;
  sizes?: string[];
}) {
  return (
    <Link href={`/product/${product.slug}`} className={styles.row}>
      <div className={styles.rowPhoto}>
        {product.badge ? (
          <span className={styles.badge}>{product.badge}</span>
        ) : null}
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt ?? product.title}
            fill
            sizes="134px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className={styles.photoEmpty}>Фото скоро</span>
        )}
      </div>

      <div className={styles.rowInfo}>
        <h3 className={styles.rowName}>{product.title}</h3>
        {product.shortDescription ? (
          <p className={styles.rowDesc}>{product.shortDescription}</p>
        ) : null}

        {sizes && sizes.length > 0 ? (
          <div className={styles.rowSizes}>
            {sizes.map((size) => (
              <span key={size} className={styles.sizeChip}>
                {size}
              </span>
            ))}
          </div>
        ) : null}

        <div className={styles.rowBottom}>
          <span>
            {product.minPriceKop === null ? (
              <span className={styles.rowPriceFrom}>Ціну уточнюйте</span>
            ) : (
              <>
                <span className={styles.rowPriceFrom}>від </span>
                <span className={styles.rowPrice}>
                  {formatPrice(product.minPriceKop)}
                </span>
              </>
            )}
          </span>
          <span className={styles.rowAction} aria-hidden>
            <ArrowRight size={17} strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}

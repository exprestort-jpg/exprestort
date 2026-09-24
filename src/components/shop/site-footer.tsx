import { Phone, Send } from "lucide-react";
import Link from "next/link";
import { TrustIcon } from "@/components/trust-icon";
import { getCurrentYear } from "@/lib/queries";
import styles from "./chrome.module.css";

/** Info links and socials are hardcoded by decision; only the catalog column,
 *  the phone and the working hours come from the database. */
const INFO_LINKS = [
  { href: "/about", label: "Про нас" },
  { href: "/privacy", label: "Політика конфіденційності" },
];

export async function SiteFooter({
  categories,
  phone,
  workingHours,
}: {
  categories: { slug: string; title: string }[];
  phone: string;
  workingHours: string;
}) {
  const year = await getCurrentYear();

  return (
    <footer className={styles.footer}>
      <div>
        <div className={styles.footerLogoName}>Експрес-торт</div>
        <div className={styles.footerTagline}>КРАФТОВІ КОРЖІ</div>
      </div>

      <div className={styles.footerColumns}>
        <div className={styles.footerColumn}>
          <span className={styles.footerColTitle}>КАТАЛОГ</span>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalog/${category.slug}`}
              className={styles.footerLink}
            >
              {category.title}
            </Link>
          ))}
        </div>

        <div className={styles.footerColumn}>
          <span className={styles.footerColTitle}>ІНФОРМАЦІЯ</span>
          {INFO_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.footerLink}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        {phone ? (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className={styles.footerPhone}
          >
            {phone}
          </a>
        ) : null}
        {workingHours ? (
          <p className={styles.footerHours}>{workingHours}</p>
        ) : null}
      </div>

      <div className={styles.footerSocial}>
        <a
          href="https://instagram.com/expresstort.com.ua"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialButton}
          aria-label="Instagram"
        >
          <TrustIcon name="instagram" size={18} />
        </a>
        <a
          href="https://t.me/expressTort"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialButton}
          aria-label="Telegram"
        >
          <Send size={18} strokeWidth={1.75} />
        </a>
        {phone ? (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className={styles.socialButton}
            aria-label="Зателефонувати"
          >
            <Phone size={18} strokeWidth={1.75} />
          </a>
        ) : null}
      </div>

      <div className={styles.footerDivider} />

      <p className={styles.copyright}>
        © {year} ТМ «Експрес-торт» ·{" "}
        <Link href="/privacy">Політика конфіденційності</Link>
      </p>
    </footer>
  );
}

import { ArrowRight, Check, Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { Carousel } from "@/components/shop/carousel";
import { CategoryTile } from "@/components/shop/category-tile";
import styles from "@/components/shop/home.module.css";
import { ProductRow } from "@/components/shop/product-row";
import { TrustIcon } from "@/components/trust-icon";
import {
  getMenuCategories,
  getPopularProducts,
  getReviews,
  getSettings,
  getTrustItems,
  toLines,
} from "@/lib/queries";

/** Fixed editorial copy — the client asked for the three steps to stay put. */
const STEPS = [
  {
    title: "Обираєте коржі",
    description: "Бісквіт, медовик або шоколад — вказуєте діаметр і кількість.",
  },
  {
    title: "Отримуєте Новою Поштою",
    description: "Пакуємо в жорстку коробку й відправляємо день у день.",
  },
  {
    title: "Промазуєте кремом і подаєте",
    description:
      "Ніякої духовки й вагів — святковий торт готовий того ж вечора.",
  },
];

export default async function HomePage() {
  const [settings, categories, popular, trust, reviews] = await Promise.all([
    getSettings(),
    getMenuCategories(),
    getPopularProducts(4),
    getTrustItems("main"),
    getReviews(),
  ]);

  const bullets = toLines(settings?.aboutBullets);

  return (
    <>
      <section className={styles.hero}>
        {settings?.heroImageUrl ? (
          <Image
            src={settings.heroImageUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 1232px) 1200px, 100vw"
            className={styles.heroImage}
          />
        ) : null}
        <div className={styles.heroScrim} />

        {settings?.heroScript ? (
          <p className={styles.heroScript}>
            {settings.heroScript}
            <Heart size={15} fill="var(--accent)" stroke="none" aria-hidden />
          </p>
        ) : null}

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {settings?.heroTitle}
            {settings?.heroTitleAccent ? (
              <span className={styles.heroTitleAccent}>
                {settings.heroTitleAccent}
              </span>
            ) : null}
          </h1>
          {settings?.heroSubtitle ? (
            <p className={styles.heroSubtitle}>{settings.heroSubtitle}</p>
          ) : null}
          <Link href="/catalog" className={`buttonPrimary ${styles.heroCta}`}>
            Обрати коржі
            <ArrowRight size={17} strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Категорії</h2>
            <Link href="/catalog" className={styles.sectionLink}>
              всі категорії
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <Carousel label="Категорії" slideWidth="clamp(150px, 44vw, 250px)">
            {categories.map((category) => (
              <CategoryTile key={category.slug} category={category} />
            ))}
          </Carousel>
        </section>
      ) : null}

      {popular.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Популярне</h2>
            <Link href="/catalog" className={styles.sectionLink}>
              всі коржі
              <ArrowRight size={14} strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <Carousel
            label="Популярне"
            slideWidth="clamp(250px, 74vw, 380px)"
            stackOnMobile
          >
            {popular.map((product) => (
              <ProductRow key={product.slug} product={product} />
            ))}
          </Carousel>
        </section>
      ) : null}

      {trust.length > 0 ? (
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.trustRow}>
            {trust.map((item) => (
              <div key={item.id} className={styles.trustItem}>
                <span className={styles.trustIcon}>
                  <TrustIcon name={item.icon} size={19} />
                </span>
                <span className={styles.trustLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Як це працює</h2>
        </div>
        <div className={styles.steps}>
          {STEPS.map((step, index) => (
            <div key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Відгуки</h2>
          </div>
          <Carousel label="Відгуки" slideWidth="clamp(266px, 84vw, 320px)">
            {reviews.map((review) => (
              <article key={review.id} className={styles.review}>
                <div className={styles.reviewTop}>
                  <div className={styles.reviewAvatar}>
                    {review.avatarUrl ? (
                      <Image
                        src={review.avatarUrl}
                        alt=""
                        fill
                        sizes="40px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span className={styles.reviewInitial} aria-hidden>
                        {review.author.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className={styles.reviewAuthor}>{review.author}</span>
                </div>
                <div
                  className={styles.reviewStars}
                  aria-label={`Оцінка ${review.rating} з 5`}
                >
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star
                      // biome-ignore lint/suspicious/noArrayIndexKey: identical decorative stars
                      key={index}
                      size={13}
                      fill="currentColor"
                      stroke="none"
                      aria-hidden
                    />
                  ))}
                </div>
                <p className={styles.reviewQuote}>{review.text}</p>
              </article>
            ))}
          </Carousel>
        </section>
      ) : null}

      <section className={`${styles.section} ${styles.stack}`}>
        <div className={styles.aboutPhoto}>
          {settings?.aboutImageUrl ? (
            <Image
              src={settings.aboutImageUrl}
              alt=""
              fill
              sizes="(min-width: 768px) 1200px, 100vw"
              style={{ objectFit: "cover" }}
            />
          ) : null}
        </div>
        <h2 className={styles.aboutTitle}>{settings?.aboutTitle}</h2>
        <p className={styles.aboutText}>{settings?.aboutText}</p>
        {bullets.length > 0 ? (
          <div className={styles.aboutList}>
            {bullets.map((bullet) => (
              <p key={bullet} className={styles.aboutBullet}>
                <Check
                  size={16}
                  strokeWidth={2.5}
                  className={styles.aboutCheck}
                  aria-hidden
                />
                {bullet}
              </p>
            ))}
          </div>
        ) : null}
        <Link href="/about" className="buttonGhost buttonBlock">
          Більше про нас
        </Link>
      </section>
    </>
  );
}

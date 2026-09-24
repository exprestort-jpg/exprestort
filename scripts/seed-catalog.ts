import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  pages,
  productSections,
  products,
  productVariants,
  reviews,
  siteSettings,
  trustItems,
} from "@/db/schema";

/**
 * Demo content taken from the Pencil design, so the admin panel and storefront
 * have something realistic to render. Re-run with --reset to wipe and refill.
 * It never touches admin_users or orders.
 */

const CATEGORIES = [
  {
    slug: "medovi-korzhi",
    title: "Медові коржі",
    description:
      "Ароматні, тонкі, еластичні коржі з натуральним медом. Ідеальна основа для домашнього торта.",
    sort: 1,
  },
  {
    slug: "biskvitni-korzhi",
    title: "Бісквітні коржі",
    description:
      "Пишні бісквіти власного випікання. Основа для будь-якого торта.",
    sort: 2,
  },
  {
    slug: "shokoladni-korzhi",
    title: "Шоколадні коржі",
    description: "Насичений смак какао в тонких рівних коржах.",
    sort: 3,
  },
  {
    slug: "napoleon",
    title: "Коржі «Наполеон»",
    description: "Хрусткі листкові коржі для класичного наполеона.",
    sort: 4,
  },
];

const PRODUCTS = [
  {
    slug: "medovi-korzhi-klasychni",
    categorySlug: "medovi-korzhi",
    title: "Медові коржі класичні",
    shortDescription: "Тонкі медові коржі з ніжним медовим смаком.",
    description:
      "Тонкі крафтові медові коржі власного виробництва. Вам залишається додати крем та зібрати торт.",
    badge: "Хіт",
    isFeatured: true,
    setContents:
      "Коржі 10 шт\nПосипка\nВолоський горіх\nПідложка для торта\nЛистівка з рецептами\nКоробка + пакування",
    variants: [
      { label: "Ø 18 см", weightLabel: "500–550 г", priceKop: 45000 },
      { label: "Ø 20 см", weightLabel: "600–650 г", priceKop: 52000 },
      { label: "Ø 22 см", weightLabel: "700–750 г", priceKop: 59000 },
    ],
  },
  {
    slug: "medovi-korzhi-shokoladni",
    categorySlug: "medovi-korzhi",
    title: "Медові коржі шоколадні",
    shortDescription: "Насичений смак какао та меду в тонких коржах.",
    description:
      "Ті самі медові коржі, але з какао. Добре працюють зі сметанним кремом.",
    badge: null,
    isFeatured: true,
    variants: [
      { label: "Ø 18 см", weightLabel: "500–550 г", priceKop: 45000 },
      { label: "Ø 20 см", weightLabel: "600–650 г", priceKop: 52000 },
    ],
  },
  {
    slug: "biskvitni-korzhi-vanilni",
    categorySlug: "biskvitni-korzhi",
    title: "Бісквітні коржі ванільні",
    shortDescription: "Пишні ванільні бісквіти. Основа для будь-якого торта.",
    description:
      "Класичний ванільний бісквіт, розрізаний на рівні коржі. Не потребує просочення.",
    badge: "Новинка",
    isFeatured: true,
    variants: [
      { label: "Ø 20 см", weightLabel: "600 г", priceKop: 38000 },
      { label: "Ø 22 см", weightLabel: "700 г", priceKop: 44000 },
    ],
  },
  {
    slug: "korzhi-napoleon",
    categorySlug: "napoleon",
    title: "Коржі «Наполеон»",
    shortDescription: "Хрусткі листкові коржі для класичного наполеона.",
    description:
      "Листкове тісто, випечене до хрусткої скоринки. 10 тонких коржів у наборі.",
    badge: null,
    isFeatured: true,
    variants: [
      { label: "Ø 20 см", weightLabel: "550 г", priceKop: 48000 },
      { label: "Ø 24 см", weightLabel: "750 г", priceKop: 62000 },
    ],
  },
];

const SECTIONS = [
  {
    title: "Склад",
    body: "Борошно пшеничне, яйця, цукор, масло вершкове, мед натуральний, сода. Без маргарину, пальмової олії та консервантів.",
  },
  {
    title: "Доставка та зберігання",
    body: "Відправляємо Новою Поштою того ж дня в жорсткій коробці. Зберігати до 14 днів у сухому місці за +18…+22 °C.",
  },
];

const TRUST = [
  // Main page strip, matching the design.
  {
    icon: "croissant",
    label: "Випікаємо щодня",
    scope: "main" as const,
    sort: 1,
  },
  {
    icon: "truck",
    label: "Відправка по Україні",
    scope: "main" as const,
    sort: 2,
  },
  {
    icon: "instagram",
    label: "78 000+ підписників",
    scope: "main" as const,
    sort: 3,
  },
  {
    icon: "credit-card",
    label: "Оплата карткою або при отриманні",
    scope: "main" as const,
    sort: 4,
  },
  // Category pages.
  {
    icon: "leaf",
    label: "Натуральний мед",
    scope: "category" as const,
    sort: 5,
  },
  {
    icon: "heart",
    label: "Без маргарину та пальмової олії",
    scope: "category" as const,
    sort: 6,
  },
  {
    icon: "crown",
    label: "Стабільна якість",
    scope: "category" as const,
    sort: 7,
  },
  {
    icon: "cake-slice",
    label: "Торти як з кондитерської",
    scope: "category" as const,
    sort: 8,
  },
];

const REVIEWS = [
  {
    author: "Олена",
    rating: 5,
    text: "Коржі приїхали цілі, рівні й дуже смачні. Торт зібрала швидко, гості не повірили, що не з кондитерської.",
    sort: 1,
  },
  {
    author: "Ірина",
    rating: 5,
    text: "Замовляю вже втретє. Медові — найкращі, смак справжнього медовика.",
    sort: 2,
  },
  {
    author: "Наталя",
    rating: 5,
    text: "Дуже виручили перед днем народження. Відправили того ж дня, все свіже.",
    sort: 3,
  },
];

const PAGES = [
  {
    slug: "about",
    title: "Про нас",
    body: "<p>Ми — маленька родинна пекарня ТМ «Експрес-торт». Кожен корж випікаємо вручну зранку й того ж дня відправляємо вам.</p>",
  },
  {
    slug: "privacy",
    title: "Політика конфіденційності",
    body: "<p>Текст політики.</p>",
  },
  { slug: "offer", title: "Публічна оферта", body: "<p>Текст оферти.</p>" },
];

async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    // product_variants / product_sections cascade from products.
    await db.delete(products);
    await db.delete(categories);
    await db.delete(reviews);
    await db.delete(trustItems);
    await db.delete(pages);
    await db.delete(siteSettings);
    console.log("Cleared catalog content.");
  }

  const existing = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(categories);
  if ((existing[0]?.n ?? 0) > 0 && !reset) {
    console.error(
      "Catalog already has categories. Re-run with --reset to replace it.",
    );
    process.exit(1);
  }

  const insertedCategories = await db
    .insert(categories)
    .values(CATEGORIES)
    .returning({
      id: categories.id,
      slug: categories.slug,
    });
  const categoryIdBySlug = new Map(
    insertedCategories.map((c) => [c.slug, c.id]),
  );

  for (const [index, product] of PRODUCTS.entries()) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId)
      throw new Error(`Unknown category ${product.categorySlug}`);

    const [inserted] = await db
      .insert(products)
      .values({
        slug: product.slug,
        categoryId,
        title: product.title,
        shortDescription: product.shortDescription,
        description: product.description,
        badge: product.badge,
        setContents: "setContents" in product ? product.setContents : null,
        isFeatured: product.isFeatured,
        sort: index + 1,
      })
      .returning({ id: products.id });

    await db.insert(productVariants).values(
      product.variants.map((variant, variantIndex) => ({
        productId: inserted.id,
        ...variant,
        sort: variantIndex + 1,
      })),
    );

    await db.insert(productSections).values(
      SECTIONS.map((section, sectionIndex) => ({
        productId: inserted.id,
        ...section,
        sort: sectionIndex + 1,
      })),
    );
  }

  await db.insert(trustItems).values(TRUST);
  await db.insert(reviews).values(REVIEWS);
  await db.insert(pages).values(PAGES);

  await db.insert(siteSettings).values({
    id: 1,
    phone: "+38 (097) 000-00-00",
    workingHours: "Приймаємо замовлення щодня 9:00–19:00",
    promoStripText: "Випікаємо щодня — відправляємо того ж дня",
    heroTitle: "Ми спекли коржі.",
    heroTitleAccent: "Ви збираєте торт",
    heroSubtitle:
      "Медовик, наполеон та бісквіти — крафтові коржі власного виробництва. Відправляємо Новою поштою по всій Україні.",
    heroScript: "Смачні торти — це просто!",
    aboutTitle: "Крафтові коржі, спечені сьогодні зранку",
    aboutText:
      "Ми — маленька родинна пекарня. Кожен корж випікаємо вручну зранку й того ж дня відправляємо вам. Без сухих сумішей, консервантів і заморозки — тільки борошно, яйця, масло та мед.",
    aboutBullets:
      "Власне виробництво з 2019 року\nТільки натуральні інгредієнти\nПонад 12 000 замовлень по Україні",
    seoTitle: "Експрес-торт — крафтові коржі для домашніх тортів",
    seoDescription:
      "Бісквітні, медові та шоколадні коржі власного випікання. Відправляємо Новою Поштою того ж дня.",
  });

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${TRUST.length} trust items, ${REVIEWS.length} reviews, ${PAGES.length} pages and site settings.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

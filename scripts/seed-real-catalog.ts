import { sql } from "drizzle-orm";
import { db, withTransaction } from "@/db";
import {
  categories,
  productSections,
  products,
  productVariants,
} from "@/db/schema";

/**
 * The real assortment supplied by the client: 5 categories, 18 products.
 * Replaces the placeholder catalog from seed-catalog.ts.
 *
 * Unlike seed-catalog.ts this touches only the catalog tables — reviews,
 * trust items, pages, site settings, orders and admin users are left alone.
 *
 * Run `npm run seed:real-catalog` for a dry run, add `-- --confirm` to write.
 * No images are written: photos are uploaded through the admin panel.
 */

const CATEGORIES = [
  {
    slug: "medovi-korzhi",
    title: "Медові коржі",
    description:
      "Ароматні тонкі коржі з натуральним медом. Класичні та шоколадні.",
    sort: 1,
  },
  {
    slug: "biskvitni-korzhi",
    title: "Бісквітні коржі",
    description:
      "Пишні бісквіти власного випікання: ванільні, шоколадні, фісташкові, червоний оксамит.",
    sort: 2,
  },
  {
    slug: "napoleon",
    title: "Коржі «Наполеон»",
    description: "Хрусткі листкові коржі для класичного «Наполеона».",
    sort: 3,
  },
  {
    slug: "figurni-korzhi",
    title: "Фігурні коржі",
    description:
      "Медові коржі у формі цифри, сердечка, пляшки, гітари та сумочки.",
    sort: 4,
  },
  {
    slug: "korzhi-bez-tsukru",
    title: "Коржі без цукру",
    description: "Коржі на еритритолі — без цукру та пшеничного борошна.",
    sort: 5,
  },
];

/** «Склад набору» repeats across products, so the lists are named once. */
const SET_HONEY_10 =
  "Коржі 10 шт\nПосипка\nВолоський горіх\nПідложка для торту\nЛистівка з рецептами\nКоробка + пакування";
const SET_SPONGE_3 =
  "Коржі 3 шт\nВолоський горіх\nПідложка для торту\nЛистівка з рецептами\nСтрічка для фіксування\nКоробка + пакування";
const SET_SHAPED_BASE =
  "Підложка міцна для торту\nМішечки для крему\nЛистівка з рецептами\nКоробка + пакування";

/** Every figured product is baked from the same honey dough. */
const HONEY_INGREDIENTS =
  "Борошно, вершкове масло 82,5%, яйця, цукор, мед, сода";

type Variant = {
  label: string;
  weightLabel: string | null;
  priceKop: number;
};

type Product = {
  slug: string;
  categorySlug: string;
  title: string;
  shortDescription: string;
  description: string;
  badge: string | null;
  isFeatured: boolean;
  setContents: string;
  ingredients: string;
  variants: Variant[];
};

const PRODUCTS: Product[] = [
  // ─── Медові коржі ───────────────────────────────────────────────────────
  {
    slug: "medovi-korzhi-klasychni",
    categorySlug: "medovi-korzhi",
    title: "Медові коржі класичні",
    shortDescription:
      "Десять тонких медових коржів у наборі. Додайте крем — і торт готовий.",
    description:
      "Класичний медовик, розібраний на складові. Десять тонких еластичних коржів на натуральному меді, посипка та волоський горіх — вам залишається лише приготувати крем і зібрати торт.",
    badge: "Хіт",
    isFeatured: true,
    setContents: SET_HONEY_10,
    ingredients: HONEY_INGREDIENTS,
    variants: [
      { label: "Ø 22 см", weightLabel: "500 г", priceKop: 63000 },
      { label: "Ø 27 см", weightLabel: "800 г", priceKop: 100000 },
      { label: "30×40 см", weightLabel: "1200 г", priceKop: 150000 },
    ],
  },
  {
    slug: "medovi-korzhi-shokoladni",
    categorySlug: "medovi-korzhi",
    title: "Медові коржі шоколадні",
    shortDescription:
      "Ті самі медові коржі, але з какао. Насичений смак шоколадного медовика.",
    description:
      "Медові коржі з додаванням какао — темніші, з глибшим смаком. Найкраще працюють зі сметанним або вершковим кремом.",
    badge: null,
    isFeatured: true,
    setContents: SET_HONEY_10,
    ingredients: "Борошно, вершкове масло 82,5%, какао, яйця, цукор, мед, сода",
    variants: [
      { label: "Ø 22 см", weightLabel: "500 г", priceKop: 63000 },
      { label: "Ø 27 см", weightLabel: "800 г", priceKop: 100000 },
      { label: "30×40 см", weightLabel: "1200 г", priceKop: 150000 },
    ],
  },

  // ─── Бісквітні коржі ────────────────────────────────────────────────────
  {
    slug: "biskvitni-vanilni-korzhi",
    categorySlug: "biskvitni-korzhi",
    title: "Бісквітні ванільні коржі",
    shortDescription:
      "Пишний ванільний бісквіт на справжніх стручках ванілі, розрізаний на три коржі.",
    description:
      "Класичний ванільний бісквіт власного випікання. Ваніль — зі стручків, не ароматизатор. Уже розрізаний на три рівні коржі, готовий до збирання.",
    badge: null,
    isFeatured: true,
    setContents: SET_SPONGE_3,
    ingredients: "Борошно, яйця, цукор, ванільний цукор (зі стручків ванілі)",
    variants: [{ label: "Ø 22 см", weightLabel: "500 г", priceKop: 43000 }],
  },
  {
    slug: "biskvitni-korzhi-shokoladni",
    categorySlug: "biskvitni-korzhi",
    title: "Бісквітні коржі шоколадні",
    shortDescription:
      "Ванільний бісквіт із какао — три рівні коржі для шоколадного торта.",
    description:
      "Пишний бісквіт із какао, розрізаний на три коржі. Добре тримає форму і не потребує обов'язкового просочення.",
    badge: null,
    isFeatured: false,
    setContents: SET_SPONGE_3,
    ingredients:
      "Борошно, яйця, какао, цукор, ванільний цукор (зі стручків ванілі)",
    variants: [{ label: "Ø 22 см", weightLabel: "500 г", priceKop: 47000 }],
  },
  {
    slug: "ekstra-shokoladni-korzhi",
    categorySlug: "biskvitni-korzhi",
    title: "Екстра шоколадні коржі",
    shortDescription:
      "Найнасиченіший шоколад у нашому асортименті. Вологі й важкі — 900 г на три коржі.",
    description:
      "Вологий шоколадний бісквіт на маслі, молоці та олії. Щільніший і насиченіший за звичайний шоколадний — три коржі важать 900 г.",
    badge: null,
    isFeatured: false,
    setContents: SET_SPONGE_3,
    ingredients:
      "Борошно, вершкове масло 82,5%, яйця, какао, цукор, молоко, олія, сода, оцет",
    variants: [{ label: "Ø 22 см", weightLabel: "900 г", priceKop: 65000 }],
  },
  {
    slug: "korzhi-chervonyi-oksamyt",
    categorySlug: "biskvitni-korzhi",
    title: "Коржі червоний оксамит",
    shortDescription:
      "Яскраво-червоні коржі з ноткою какао. Ефектний зріз торта на святковому столі.",
    description:
      "Red velvet на вершковому маслі: оксамитова текстура, легка нотка какао і насичений червоний колір. Класична пара — крем-чиз.",
    badge: null,
    isFeatured: true,
    setContents: SET_SPONGE_3,
    ingredients:
      "Борошно, вершкове масло 82,5%, яйця, какао, цукор, розпушувач, барвник харчовий",
    variants: [{ label: "Ø 22 см", weightLabel: "650 г", priceKop: 63000 }],
  },
  {
    slug: "fistashkovi-biskvitni-korzhi",
    categorySlug: "biskvitni-korzhi",
    title: "Фісташкові бісквітні коржі",
    shortDescription:
      "Бісквіт на справжній фісташковій пасті. Ніжний горіховий смак і зелений зріз.",
    description:
      "Бісквітні коржі на фісташковій пасті — з вираженим горіховим смаком і характерним зеленим кольором. Смачно з крем-чизом або вершковим кремом.",
    badge: null,
    isFeatured: false,
    setContents: SET_SPONGE_3,
    ingredients: "Борошно, яйця, цукор, фісташкова паста, барвник харчовий",
    variants: [{ label: "Ø 22 см", weightLabel: "500 г", priceKop: 57000 }],
  },
  {
    slug: "korzhi-zhinochi-prymkhy",
    categorySlug: "biskvitni-korzhi",
    title: "Коржі «Жіночі примхи»",
    shortDescription:
      "Бісквіт із волоським горіхом, маком і курагою — три різні коржі в одному наборі.",
    description:
      "Улюблена радянська класика в сучасному виконанні: три коржі з волоським горіхом, маком і курагою. Найкраще зі сметанним кремом.",
    badge: null,
    isFeatured: false,
    setContents: SET_SPONGE_3,
    ingredients: "Борошно, яйця, цукор, волоський горіх, мак, курага",
    variants: [{ label: "Ø 22 см", weightLabel: "650 г", priceKop: 57000 }],
  },
  {
    slug: "korzhi-kucheriavyi-pincher",
    categorySlug: "biskvitni-korzhi",
    title: "Коржі «Кучерявий пінчер»",
    shortDescription:
      "Корж-основа та шоколадні й світлі кубики. Зберіть торт гіркою — і полийте помадкою.",
    description:
      "Набір для «Кучерявого пінчера»: корж-основа плюс світлі та шоколадні кубики, які викладаються гіркою на крем. У комплекті сушена вишня, волоський горіх і какао з цукром для помадки.",
    badge: null,
    isFeatured: false,
    setContents:
      "Корж-основа + кубики світлі та шоколадні 800 г\nВолоський горіх\nВишня сушена\nКакао + цукор для помадки\nПідложка для торту\nЛистівка з рецептами\nКоробка + пакування",
    ingredients:
      "Борошно, цукор, какао, сметана, згущене молоко, яйця, сода, оцет",
    variants: [{ label: "Ø 22 см", weightLabel: "800 г", priceKop: 65000 }],
  },

  // ─── Наполеон ───────────────────────────────────────────────────────────
  {
    slug: "korzhi-napoleon",
    categorySlug: "napoleon",
    title: "Коржі «Наполеон»",
    shortDescription:
      "Вісім-дев'ять хрустких листкових коржів для класичного наполеона.",
    description:
      "Тонкі листкові коржі, випечені до хрусткої скоринки. У наборі 8–9 коржів, посипка та волоський горіх — залишається зварити заварний крем.",
    badge: null,
    isFeatured: true,
    setContents:
      "Коржі 8–9 шт\nПосипка\nВолоський горіх\nПідложка для торту\nЛистівка з рецептами\nКоробка + пакування",
    ingredients: "Борошно, вершкове масло 82,5%",
    variants: [{ label: "Ø 22 см", weightLabel: "500 г", priceKop: 65000 }],
  },

  // ─── Фігурні коржі ──────────────────────────────────────────────────────
  {
    slug: "medovi-korzhi-tsyfra",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Цифра»",
    shortDescription:
      "Медові коржі у формі цифри 0–9. Бажану цифру вкажіть у коментарі до замовлення.",
    description:
      "Три медові коржі у формі однієї цифри — від 0 до 9. Вкажіть потрібну цифру в коментарі до замовлення; якщо не вкажете, ми уточнимо при підтвердженні. У наборі рисові кульки, волоський горіх і мішечки для крему.",
    badge: null,
    isFeatured: true,
    setContents: `3 коржі однієї цифри\nВолоський горіх\nРисові кульки\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "≈27×20 см", weightLabel: "≈450 г", priceKop: 58000 }],
  },
  {
    slug: "medovi-korzhi-pliashka",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Пляшка»",
    shortDescription:
      "Медові коржі у формі пляшки з декором з орео, мигдалю та цукрової листівки.",
    description:
      "Три медові коржі у формі пляшки — торт для чоловічого свята. У наборі печиво орео, мигдаль, цукрова листівка та волоський горіх.",
    badge: null,
    isFeatured: false,
    setContents: `Медові коржі 3 шт\nВолоський горіх\nОрео, мигдаль, цукрова листівка\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "350 г", weightLabel: null, priceKop: 60000 }],
  },
  {
    slug: "medovi-korzhi-serdechko",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Сердечко»",
    shortDescription:
      "Медові коржі у формі серця з цукровими сердечками для декору.",
    description:
      "Три медові коржі у формі серця. У наборі цукрові сердечка-прикраси та волоський горіх — торт для 14 лютого, річниці чи освідчення.",
    badge: null,
    isFeatured: false,
    setContents: `Медові коржі 3 шт\nВолоський горіх\nЦукрові сердечка (прикраси)\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "350 г", weightLabel: null, priceKop: 45000 }],
  },
  {
    slug: "medovi-korzhi-hitara",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Гітара»",
    shortDescription:
      "Медові коржі у формі гітари — торт для музиканта чи меломана.",
    description:
      "Три медові коржі у формі гітари. Декор залишається за вами: коржі тримають форму й легко збираються в ефектний торт.",
    badge: null,
    isFeatured: false,
    setContents: `Медові коржі 3 шт\nВолоський горіх\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "500 г", weightLabel: null, priceKop: 58000 }],
  },
  {
    slug: "medovi-korzhi-khose",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Хосе»",
    shortDescription:
      "Медові коржі у формі ведмедика Хосе з цукровою мордочкою та бантиком.",
    description:
      "Три медові коржі у формі ведмедика Хосе. У наборі цукрова мордочка та бантик — дитячий торт збирається без кондитерських навичок.",
    badge: null,
    isFeatured: false,
    setContents: `Медові коржі 3 шт\nВолоський горіх\nЦукрова мордочка та бантик\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "350 г", weightLabel: null, priceKop: 53000 }],
  },
  {
    slug: "medovi-korzhi-sumochka",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Сумочка»",
    shortDescription:
      "Медові коржі у формі сумочки з цукровим написом. Торт для подруги чи мами.",
    description:
      "Три медові коржі у формі сумочки з цукровим написом «Chanel». У наборі волоський горіх і мішечки для крему.",
    badge: null,
    isFeatured: false,
    setContents: `Медові коржі 3 шт\nВолоський горіх\nЦукровий напис «Chanel»\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "350 г", weightLabel: null, priceKop: 45000 }],
  },
  {
    slug: "medovi-korzhi-bohynia",
    categorySlug: "figurni-korzhi",
    title: "Медові коржі «Богиня»",
    shortDescription:
      "Медові коржі-корсет із мастиковими деталями та цукровою листівкою.",
    description:
      "Найефектніший набір: три медові коржі у формі корсета плюс чотири кружечки, анатомічні деталі з мастики та цукрова листівка. Торт для дівич-вечора чи ювілею.",
    badge: null,
    isFeatured: false,
    setContents: `Медові коржі корсет 3 шт\n4 шт кружечки\nВолоський горіх\nЦукрова листівка\nАнатомічні деталі з мастики\n${SET_SHAPED_BASE}`,
    ingredients: HONEY_INGREDIENTS,
    variants: [{ label: "500 г", weightLabel: null, priceKop: 70000 }],
  },

  // ─── Без цукру ──────────────────────────────────────────────────────────
  {
    slug: "korzhi-bez-tsukru-rafaello",
    categorySlug: "korzhi-bez-tsukru",
    title: "Коржі без цукру «Рафаелло»",
    shortDescription:
      "Кокосові коржі на еритритолі — без цукру та пшеничного борошна.",
    description:
      "Три коржі на кокосовому та рисовому борошні, підсолоджені еритритолом. У наборі еритритол і крохмаль для крему — торт виходить повністю без цукру.",
    badge: null,
    isFeatured: false,
    setContents:
      "Коржі 3 шт\nЕритритол, крохмаль (для крему)\nПідложка для торту\nЛистівка з рецептами\nСтрічка для фіксування\nКоробка + пакування",
    ingredients:
      "Яйця, еритритол, інулін, кокосове борошно, рисове борошно, розпушувач",
    variants: [{ label: "Ø 22 см", weightLabel: "400 г", priceKop: 50000 }],
  },
];

/** Second accordion row, identical on every product. */
const DELIVERY_SECTION = {
  title: "Доставка та зберігання",
  body: "Відправляємо Новою Поштою того ж дня в жорсткій коробці. Зберігати до 14 днів у сухому місці за +18…+22 °C.",
};

const variantCount = PRODUCTS.reduce((n, p) => n + p.variants.length, 0);

async function main() {
  if (!process.argv.includes("--confirm")) {
    const [{ c }] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(categories);
    const [{ p }] = await db
      .select({ p: sql<number>`count(*)::int` })
      .from(products);

    console.log(
      `Dry run. Currently in the database: ${c} categories, ${p} products.`,
    );
    console.log(
      `Would delete all of them and insert ${CATEGORIES.length} categories, ` +
        `${PRODUCTS.length} products, ${variantCount} variants, ` +
        `${PRODUCTS.length * 2} sections, 0 images.`,
    );
    console.log("Re-run with --confirm to apply.");
    return;
  }

  await withTransaction(async (tx) => {
    // Products first: categories are ON DELETE RESTRICT. Variants, sections
    // and images cascade from products.
    await tx.delete(products);
    await tx.delete(categories);

    const insertedCategories = await tx
      .insert(categories)
      .values(CATEGORIES)
      .returning({ id: categories.id, slug: categories.slug });
    const categoryIdBySlug = new Map(
      insertedCategories.map((c) => [c.slug, c.id]),
    );

    for (const [index, product] of PRODUCTS.entries()) {
      const categoryId = categoryIdBySlug.get(product.categorySlug);
      if (!categoryId) {
        throw new Error(`Unknown category ${product.categorySlug}`);
      }

      const [inserted] = await tx
        .insert(products)
        .values({
          slug: product.slug,
          categoryId,
          title: product.title,
          shortDescription: product.shortDescription,
          description: product.description,
          badge: product.badge,
          setContents: product.setContents,
          isFeatured: product.isFeatured,
          sort: index + 1,
        })
        .returning({ id: products.id });

      await tx.insert(productVariants).values(
        product.variants.map((variant, variantIndex) => ({
          productId: inserted.id,
          ...variant,
          sort: variantIndex + 1,
        })),
      );

      await tx.insert(productSections).values([
        {
          productId: inserted.id,
          title: "Склад коржів",
          body: product.ingredients,
          sort: 1,
        },
        { productId: inserted.id, ...DELIVERY_SECTION, sort: 2 },
      ]);
    }
  });

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ` +
      `${variantCount} variants and ${PRODUCTS.length * 2} sections.`,
  );
  console.log(
    "Images were not touched — upload photos in the admin panel. " +
      "Restart next dev (or redeploy) to flush the storefront cache.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

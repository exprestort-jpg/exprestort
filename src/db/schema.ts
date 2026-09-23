import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Money is stored in kopiyky (integer) everywhere. 450 ₴ => 45000.
 * Never use floats for prices.
 */

export const orderStatus = pgEnum("order_status", [
  "new",
  "confirmed",
  "shipped",
  "done",
  "cancelled",
]);

/** Where a trust item is shown. */
export const trustScope = pgEnum("trust_scope", ["main", "category"]);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    sort: integer("sort").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 160 }).notNull(),
    shortDescription: varchar("short_description", { length: 240 }),
    description: text("description"),
    /** Free text shown on the card corner: «Хіт», «Новинка». Null = no badge. */
    badge: varchar("badge", { length: 24 }),
    /** «Склад набору» bullet list on the product page, one item per line. */
    setContents: text("set_contents"),
    isActive: boolean("is_active").notNull().default(true),
    /** Manual pin into «Популярне», overrides sales-based ranking. */
    isFeatured: boolean("is_featured").notNull().default(false),
    sort: integer("sort").notNull().default(0),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.categoryId),
    /*
     * Trigram index for the header search. It matches on `lower(title) like
     * '%q%'`, and a leading wildcard makes a btree useless — only a GIN trigram
     * index can serve that. Needs the pg_trgm extension (see the migration).
     */
    index("products_title_trgm_idx").using(
      "gin",
      sql`lower(${t.title}) gin_trgm_ops`,
    ),
  ],
);

/** One buyable size of a product: «Ø 18 см · 500–550 г · 450 ₴». */
export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 40 }).notNull(),
    weightLabel: varchar("weight_label", { length: 40 }),
    priceKop: integer("price_kop").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 200 }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/** Accordion rows on the product page: «Склад», «Доставка та зберігання». */
export const productSections = pgTable(
  "product_sections",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 80 }).notNull(),
    body: text("body").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("product_sections_product_idx").on(t.productId)],
);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 80 }).notNull(),
  avatarUrl: text("avatar_url"),
  rating: smallint("rating").notNull().default(5),
  text: text("text").notNull(),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const trustItems = pgTable("trust_items", {
  id: serial("id").primaryKey(),
  /** Lucide icon name, picked from a fixed list in the admin UI. */
  icon: varchar("icon", { length: 40 }).notNull(),
  label: varchar("label", { length: 80 }).notNull(),
  scope: trustScope("scope").notNull().default("main"),
  sort: integer("sort").notNull().default(0),
});

/** Static pages edited as rich text: about / privacy / offer. */
export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    /** Sanitized HTML from the TipTap editor. */
    body: text("body").notNull().default(""),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("pages_slug_idx").on(t.slug)],
);

/** Single row, id is always 1. */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  phone: varchar("phone", { length: 32 }).notNull().default(""),
  workingHours: varchar("working_hours", { length: 160 }).notNull().default(""),
  promoStripText: varchar("promo_strip_text", { length: 160 })
    .notNull()
    .default(""),
  heroTitle: varchar("hero_title", { length: 160 }).notNull().default(""),
  /** Second line of the hero headline, rendered in the brand orange. */
  heroTitleAccent: varchar("hero_title_accent", { length: 160 })
    .notNull()
    .default(""),
  heroSubtitle: varchar("hero_subtitle", { length: 320 }).notNull().default(""),
  heroScript: varchar("hero_script", { length: 80 }).notNull().default(""),
  heroImageUrl: text("hero_image_url"),
  aboutTitle: varchar("about_title", { length: 160 }).notNull().default(""),
  aboutText: text("about_text").notNull().default(""),
  /** Ticked bullets under the About text, one per line. */
  aboutBullets: text("about_bullets").notNull().default(""),
  aboutImageUrl: text("about_image_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    /** Human-facing number shown to the customer and the manager. */
    number: varchar("number", { length: 16 }).notNull(),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    npCityRef: varchar("np_city_ref", { length: 64 }).notNull(),
    npCityName: varchar("np_city_name", { length: 160 }).notNull(),
    npWarehouseRef: varchar("np_warehouse_ref", { length: 64 }).notNull(),
    npWarehouseName: varchar("np_warehouse_name", { length: 240 }).notNull(),
    comment: text("comment"),
    status: orderStatus("status").notNull().default("new"),
    totalKop: integer("total_kop").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    index("orders_created_at_idx").on(t.createdAt),
  ],
);

/**
 * Snapshot columns are deliberate: products and prices get edited, order
 * history must stay frozen as it was at checkout time.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: integer("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    titleSnap: varchar("title_snap", { length: 160 }).notNull(),
    variantSnap: varchar("variant_snap", { length: 80 }).notNull(),
    priceKopSnap: integer("price_kop_snap").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
  ],
);

/** Seeded by script only. There is no registration flow anywhere in the app. */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

/**
 * Throttles the credentials login. A public /admin/login with no throttle is an
 * open brute-force target, and an in-memory counter would not survive the
 * serverless instance it lives in.
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    ip: varchar("ip", { length: 64 }).notNull(),
    success: boolean("success").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("login_attempts_email_idx").on(t.email, t.createdAt),
    index("login_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
);

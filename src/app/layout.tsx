import type { Metadata } from "next";
import { Caveat, Manrope, Playfair_Display } from "next/font/google";
import { getSettings } from "@/lib/queries";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

/** Used only on a database that has never been seeded. */
const FALLBACK_TITLE = "Експрес-торт — крафтові коржі для домашніх тортів";
const FALLBACK_DESCRIPTION =
  "Бісквітні, медові та шоколадні коржі власного випікання. Відправляємо Новою Поштою того ж дня.";

/**
 * The home page inherits this, so editing the SEO block in the admin changes
 * the storefront title and description everywhere they are not overridden.
 * getSettings is cached with the "settings" tag, so this costs no extra query.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const title =
    settings?.seoTitle ||
    [settings?.heroTitle, settings?.heroTitleAccent]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    FALLBACK_TITLE;
  const description =
    settings?.seoDescription || settings?.heroSubtitle || FALLBACK_DESCRIPTION;

  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    openGraph: {
      type: "website",
      locale: "uk_UA",
      siteName: "Експрес-торт",
      url: siteUrl(),
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${manrope.variable} ${playfair.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

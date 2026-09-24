import type { Metadata } from "next";
import { Caveat, Manrope, Playfair_Display } from "next/font/google";
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

const title = "Експрес-торт — крафтові коржі для домашніх тортів";
const description =
  "Бісквітні, медові та шоколадні коржі власного випікання. Відправляємо Новою Поштою того ж дня.";

export const metadata: Metadata = {
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

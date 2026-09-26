import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-admin";
import { siteHost } from "@/lib/site";
import { SiteHostProvider } from "./_components/site-host";
import { logoutAction } from "./actions";
import styles from "./layout.module.css";

/**
 * The admin shell reads the session cookie, so it can never be part of the
 * static shell. Blocking here is correct: there is nothing worth prerendering
 * behind a login, and the alternative is a Suspense skeleton for a dashboard
 * only one person ever sees.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Адмінпанель — Експрес-торт",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/categories", label: "Категорії" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/reviews", label: "Відгуки" },
  { href: "/admin/trust", label: "Переваги" },
  { href: "/admin/pages", label: "Сторінки" },
  { href: "/admin/settings", label: "Налаштування" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Експрес-торт</div>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>
        <form action={logoutAction} className={styles.footer}>
          <span className={styles.user}>{user.name}</span>
          <button type="submit" className={styles.logout}>
            Вийти
          </button>
        </form>
      </aside>
      <main className={styles.content}>
        <SiteHostProvider host={siteHost()}>{children}</SiteHostProvider>
      </main>
    </div>
  );
}

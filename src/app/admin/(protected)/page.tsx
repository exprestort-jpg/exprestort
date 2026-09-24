import { requireAdmin } from "@/lib/require-admin";

// Reads the session, so it blocks rather than prerenders. Every admin page needs this.
export const instant = false;

export default async function AdminHomePage() {
  const user = await requireAdmin();

  return (
    <>
      <h1>Вітаємо, {user.name}</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "var(--s-8)" }}>
        Оберіть розділ у меню зліва: товари, категорії, замовлення, відгуки,
        переваги, сторінки та налаштування.
      </p>
    </>
  );
}

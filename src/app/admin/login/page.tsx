import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Вхід — Експрес-торт",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className={styles.screen}>
      <LoginForm />
    </main>
  );
}

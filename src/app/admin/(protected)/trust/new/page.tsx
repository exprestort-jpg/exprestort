import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { emptyTrustItem, TrustForm } from "../trust-form";

export const instant = false;

export default async function NewTrustPage() {
  await requireAdmin();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Нова перевага</h1>
      </header>
      <TrustForm values={emptyTrustItem} />
    </>
  );
}

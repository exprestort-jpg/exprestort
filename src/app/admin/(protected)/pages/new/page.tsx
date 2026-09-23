import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { emptyPage, PageForm } from "../page-form";

export const instant = false;

export default async function NewPagePage() {
  await requireAdmin();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Нова сторінка</h1>
      </header>
      <PageForm values={emptyPage} />
    </>
  );
}

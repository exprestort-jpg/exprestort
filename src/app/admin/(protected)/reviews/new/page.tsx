import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { emptyReview, ReviewForm } from "../review-form";

export const instant = false;

export default async function NewReviewPage() {
  await requireAdmin();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Новий відгук</h1>
      </header>
      <ReviewForm values={emptyReview} />
    </>
  );
}

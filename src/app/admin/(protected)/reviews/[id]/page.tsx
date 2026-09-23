import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { ReviewForm } from "../review-form";

export const instant = false;

export default async function EditReviewPage({
  params,
}: PageProps<"/admin/reviews/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, Number(id)))
    .limit(1);

  if (!review) notFound();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Відгук від {review.author}</h1>
      </header>
      <ReviewForm
        values={{
          id: review.id,
          author: review.author,
          avatarUrl: review.avatarUrl ?? "",
          rating: review.rating,
          text: review.text,
          sort: review.sort,
        }}
      />
    </>
  );
}

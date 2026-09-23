import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { PageForm } from "../page-form";

export const instant = false;

export default async function EditPagePage({
  params,
}: PageProps<"/admin/pages/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [row] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, Number(id)))
    .limit(1);

  if (!row) notFound();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{row.title}</h1>
      </header>
      <PageForm
        values={{
          id: row.id,
          title: row.title,
          slug: row.slug,
          body: row.body,
          seoTitle: row.seoTitle ?? "",
          seoDescription: row.seoDescription ?? "",
        }}
      />
    </>
  );
}

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { CategoryForm } from "../category-form";

export const instant = false;

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, Number(id)))
    .limit(1);

  if (!category) notFound();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{category.title}</h1>
      </header>
      <CategoryForm
        values={{
          id: category.id,
          title: category.title,
          slug: category.slug,
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          sort: category.sort,
          isActive: category.isActive,
          seoTitle: category.seoTitle ?? "",
          seoDescription: category.seoDescription ?? "",
        }}
      />
    </>
  );
}

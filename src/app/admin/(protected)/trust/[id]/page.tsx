import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { trustItems } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { TrustForm } from "../trust-form";

export const instant = false;

export default async function EditTrustPage({
  params,
}: PageProps<"/admin/trust/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [item] = await db
    .select()
    .from(trustItems)
    .where(eq(trustItems.id, Number(id)))
    .limit(1);

  if (!item) notFound();

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{item.label}</h1>
      </header>
      <TrustForm
        values={{
          id: item.id,
          icon: item.icon,
          label: item.label,
          scope: item.scope,
          sort: item.sort,
        }}
      />
    </>
  );
}

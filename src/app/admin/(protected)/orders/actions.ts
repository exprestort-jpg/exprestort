"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ORDER_STATUSES } from "@/lib/orders";
import { assertAdmin } from "@/lib/require-admin";

const schema = z.object({
  id: z.number().int().positive(),
  status: z.enum(ORDER_STATUSES),
});

export async function updateOrderStatus(
  id: number,
  status: string,
): Promise<void> {
  await assertAdmin();

  const parsed = schema.safeParse({ id, status });

  if (!parsed.success) return;

  await db
    .update(orders)
    .set({ status: parsed.data.status })
    .where(eq(orders.id, parsed.data.id));

  // Nothing about orders is cached on the server, so there is no tag to expire.
  // The stale copy lives in the browser's client router cache: without this the
  // order page the manager navigates back into still shows the old status.
  refresh();
}

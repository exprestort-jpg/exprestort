"use client";

import { useOptimistic, useTransition } from "react";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/orders";
import styles from "../_components/admin.module.css";
import { updateOrderStatus } from "./actions";

/** Changing the value submits immediately — a separate Save button for one
 *  dropdown is friction the manager does not need. The select is controlled by
 *  an optimistic value because React resets uncontrolled form fields as soon as
 *  an action settles, which would flash the old status until the RSC refresh
 *  arrives. */
export function StatusSelect({
  id,
  status,
}: {
  id: number;
  status: OrderStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  return (
    <select
      name="status"
      className={styles.select}
      value={optimisticStatus}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value as OrderStatus;
        startTransition(async () => {
          setOptimisticStatus(next);
          await updateOrderStatus(id, next);
        });
      }}
      aria-label="Статус замовлення"
    >
      {ORDER_STATUSES.map((value) => (
        <option key={value} value={value}>
          {ORDER_STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}

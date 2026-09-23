"use client";

import { useRef } from "react";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/orders";
import styles from "../_components/admin.module.css";
import { updateOrderStatus } from "./actions";

/** Changing the value submits immediately — a separate Save button for one
 *  dropdown is friction the manager does not need. */
export function StatusSelect({
  id,
  status,
}: {
  id: number;
  status: OrderStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateOrderStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        className={styles.select}
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Статус замовлення"
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}

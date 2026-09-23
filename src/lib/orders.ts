export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "shipped",
  "done",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  confirmed: "Підтверджено",
  shipped: "Відправлено",
  done: "Виконано",
  cancelled: "Скасовано",
};

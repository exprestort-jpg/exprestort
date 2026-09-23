"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cart lives in localStorage only — there are no accounts. Prices are kept for
 * display, but checkout re-reads every price from the database, so a tampered
 * cart cannot change what the customer is charged.
 */
export type CartLine = {
  productId: number;
  variantId: number;
  slug: string;
  title: string;
  variantLabel: string;
  priceKop: number;
  imageUrl: string | null;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  hydrated: boolean;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,

      add: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (item) => item.variantId === line.variantId,
          );
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                item.variantId === line.variantId
                  ? { ...item, qty: item.qty + qty }
                  : item,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, qty }] };
        }),

      setQty: (variantId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((item) => item.variantId !== variantId)
              : state.lines.map((item) =>
                  item.variantId === variantId ? { ...item, qty } : item,
                ),
        })),

      remove: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((item) => item.variantId !== variantId),
        })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: "et-cart",
      // Guards against rendering server-empty markup over a restored cart.
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.qty, 0);
}

export function cartTotalKop(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.priceKop * line.qty, 0);
}

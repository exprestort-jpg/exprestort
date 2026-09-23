<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MVVM for React / Next.js

A portable, project-agnostic guide to Feature-Driven MVVM in React and Next.js codebases.
Nothing here is tied to a specific product, library vendor, or domain — swap the concrete
tools for whatever your project uses.

---

## 1. Core Idea

MVVM splits a feature into three layers with a strict, one-directional dependency graph:

```
Model  ←  ViewModel  ←  View
(knows nothing)  (knows Model)  (knows ViewModel only)
```

- **Data flows** `Model → ViewModel → View`
- **Interactions flow** `View → ViewModel → Model`

A layer may only import _downward_. A Model never imports a ViewModel. A View never
imports a Model. Violating this is the single failure mode that kills the pattern.

### Why

| Property       | How MVVM delivers it                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Testability    | Model is pure TS (no runtime). ViewModel tests via `renderHook`. View tests via DOM queries with a mocked ViewModel. |
| Replaceability | Swap REST → GraphQL by rewriting one Model. Swap design system by rewriting one View.                                |
| Reviewability  | "Is there a `fetch` in this `.tsx`?" is a mechanical review rule, not a judgement call.                              |
| Onboarding     | Every feature has the same shape. Finding "where does X happen" becomes navigation, not search.                      |

---

## 2. Layer Contracts

### 2.1 Model — the truth layer

**Owns:** data types, API calls, serialization, domain rules, validation, pure computation.

**Forbidden:** any React import. No JSX, no hooks, no `useState`, no context, no
component types. If the Model needs React, the logic belongs in the ViewModel.

```ts
// Model/OrderTypes.ts
export interface Order {
  id: string;
  total: number;
  placedAt: string; // ISO
}

export interface CreateOrderPayload {
  items: Array<{ sku: string; qty: number }>;
}

// Model/OrderModel.ts
import { http } from 'src/lib/http';
import { Endpoints } from 'src/Constants/Endpoints';
import type { Order, CreateOrderPayload } from './OrderTypes';

export class OrderModel {
  async list(): Promise<Order[]> {
    const { data } = await http.get<Order[]>(Endpoints.Orders);
    return data;
  }

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await http.post<Order>(Endpoints.Orders, payload);
    return data;
  }
}

// Domain rule — pure, trivially testable, no mocks needed
export function isRefundable(order: Order, now: Date): boolean {
  const days = (now.getTime() - new Date(order.placedAt).getTime()) / 86_400_000;
  return days <= 30;
}
```

**Class or module of functions?** Either works. Use a class when you want a single
instance injectable via context (easy to fake in tests, easy to configure per-environment).
Use plain exported functions when the Model is stateless and no injection is needed.
Pick one convention per project and hold it.

### 2.2 ViewModel — the adaptation layer

**Owns:** React state, server-state caching, side effects, derived/aggregated data,
callbacks the View will bind to events, and UI-shaped output (already formatted,
already sorted, already grouped).

**Is always** a custom hook, `useSomething()`.

**Forbidden:** JSX. If you want to return markup, you are writing a View.

```ts
// ViewModel/useOrders.ts
export function useOrders() {
  const model = useOrderModel(); // injected instance, or import directly
  const queryClient = useQueryClient();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QueryKeys.Orders],
    queryFn: () => model.list(),
  });

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: (payload: CreateOrderPayload) => model.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QueryKeys.Orders] }),
  });

  // Derivation belongs here, NOT in the View
  const refundable = useMemo(() => data.filter(order => isRefundable(order, new Date())), [data]);

  return { orders: data, refundable, isLoading, isPending, error, createOrder };
}
```

**The ViewModel's return value is a public API.** Name it in UI vocabulary
(`isSubmitting`, `canSubmit`, `errorMessage`), not transport vocabulary
(`mutation2`, `rawResponse`). If the View has to interpret what a field means,
the abstraction leaked.

### 2.3 View — the presentation layer

**Owns:** markup, styles, accessibility, event wiring, local ephemeral UI state
(is a dropdown open, is a tooltip hovered).

**Forbidden:** API calls, data transformation, business conditionals, cross-feature
imports of other Models.

```tsx
// View/OrdersView.tsx
export default function OrdersView() {
  const { orders, isLoading, createOrder, isPending } = useOrders();

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <section className={styles.root}>
      <OrderList orders={orders} />
      <Button disabled={isPending} onClick={() => createOrder(draft)}>
        Place order
      </Button>
    </section>
  );
}
```

**Split Views in two tiers:**

1. **Container View** — one per feature. Calls the ViewModel hook. Wires nothing else.
2. **Presentational components** — props in, callbacks out. Zero hooks from the feature.
   These are the reusable ones; they can live in a shared `Components/` directory once
   two features need them.

---

## 3. Directory Layout

```
src/
  Feature/
    Orders/
      Model/
        OrderTypes.ts
        OrderModel.ts
        OrderModel.test.ts
      ViewModel/
        useOrders.ts
        useOrdersState.ts        // store slice, if the feature has global state
        useOrders.test.ts
      View/
        OrdersView.tsx
        OrdersView.module.scss
        OrdersView.test.tsx
        Components/
          OrderRow.tsx
          OrderRow.module.scss
      index.ts                    // barrel: export the View + public types only
  Components/                     // shared dumb UI, no feature knowledge
  Hooks/                          // generic hooks, no feature knowledge
  lib/                            // pure utilities, domain-agnostic
  Constants/                      // endpoints, query keys, routes, enums
  Context/                        // providers, model injection
```

**The barrel file is the feature's public surface.** Export the container View and the
types other features legitimately need. Do _not_ export the Model or internal hooks —
that is how cross-feature coupling starts.

**Feature-to-feature communication** should go through: shared global store slices,
a shared Model in `lib/`, route params, or props. Never by importing another feature's
ViewModel.

---

## 4. State Placement

Choosing where state lives is the decision that most often goes wrong.

| State kind                       | Lives in                                                | Example                                    |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| Server data                      | ViewModel, via a server-state cache (React Query / SWR) | order list, user profile                   |
| Cross-feature client state       | Global store (Zustand / Redux / Jotai)                  | auth session, theme, unread count          |
| Feature-scoped shared state      | Context provider at the feature root                    | wizard step, selected row across sub-views |
| Single-component ephemeral state | `useState` in the View                                  | dropdown open, input focus                 |

Rules of thumb:

- **Do not mirror server data into a global store.** The cache is the store. Copying it
  creates two sources of truth that drift.
- **Push state down until it hurts, then lift it one level.** Global by default is how
  you get unbounded re-renders.
- **Selector discipline:** when reading multiple fields from a global store, use a
  shallow-equality selector so you don't re-render on every unrelated store write.

```ts
// Bad — new object identity every render
const { a, b } = useStore(s => ({ a: s.a, b: s.b }));

// Good
const { a, b } = useStore(useShallow(s => ({ a: s.a, b: s.b })));
```

---

## 5. Next.js Adaptation

MVVM predates Server Components; the layering still holds, but the _boundary_ shifts.

### 5.1 Where each layer runs

| Layer     | Server Component         | Client Component | Route Handler / Server Action |
| --------- | ------------------------ | ---------------- | ----------------------------- |
| Model     | ✅ call directly         | ✅ via ViewModel | ✅ call directly              |
| ViewModel | ❌ hooks unavailable     | ✅ primary home  | ❌                            |
| View      | ✅ static/presentational | ✅ interactive   | ❌                            |

The Model is the only layer that is **isomorphic** — it runs unchanged on both sides.
That is precisely why it must stay free of React _and_ of browser globals. Guard
`window`, `localStorage`, and `document` behind an injected adapter, not an inline check.

### 5.2 Two valid patterns

**Pattern A — Server-fetched, client-interactive (prefer this).**
The Server Component calls the Model directly and passes plain data down; the client
View hydrates it into its ViewModel.

```tsx
// app/orders/page.tsx   (Server Component — no 'use client')
import { OrderModel } from 'src/Feature/Orders/Model/OrderModel';
import OrdersView from 'src/Feature/Orders/View/OrdersView';

export default async function OrdersPage() {
  const orders = await new OrderModel().list();
  return <OrdersView initialOrders={orders} />;
}
```

```tsx
// View/OrdersView.tsx
'use client';

export default function OrdersView({ initialOrders }: { initialOrders: Order[] }) {
  const { orders, createOrder } = useOrders({ initialOrders });
  ...
}
```

```ts
// ViewModel/useOrders.ts
'use client';

export function useOrders({ initialOrders }: { initialOrders?: Order[] } = {}) {
  const { data = [] } = useQuery({
    queryKey: [QueryKeys.Orders],
    queryFn: () => model.list(),
    initialData: initialOrders, // server render seeds the cache — no fetch waterfall
  });
  ...
}
```

**Pattern B — Fully client-side.** The page is a thin Server Component that renders a
`'use client'` View; the ViewModel fetches everything. Use for auth-gated dashboards,
highly interactive screens, or anything behind a client-only session.

### 5.3 Server Actions and the Model

A Server Action is a **transport**, not a layer. Keep the logic in the Model and let the
action be a thin, authenticated wrapper:

```ts
// Model/OrderActions.ts
'use server';

import { OrderModel } from './OrderModel';
import { requireSession } from 'src/lib/auth';

export async function createOrderAction(payload: CreateOrderPayload) {
  const session = await requireSession();
  return new OrderModel(session).create(payload);
}
```

The ViewModel then calls `createOrderAction` exactly as it would call any Model method —
it never learns whether the work happens over HTTP or an action.

**Always re-validate input and re-check authorization inside the action.** A Server
Action is a public HTTP endpoint; client-side checks in the ViewModel are UX, not security.

### 5.4 Next.js placement rules

- `app/` holds **routing only**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
  Each `page.tsx` is a few lines that import a feature's View. No feature logic in `app/`.
- Features live in `src/Feature/`, outside `app/`, so routing can be restructured without
  touching features.
- Put `'use client'` as low in the tree as possible — on the container View, not the page.
  A `'use client'` on a layout makes the whole subtree client-side.
- `loading.tsx` / `error.tsx` replace ad-hoc loading and error branches in the View when
  data is server-fetched.
- Server-only Model modules that touch secrets should import `server-only` so an
  accidental client import fails at build time instead of leaking the bundle.

---

## 6. Testing Strategy

One test style per layer. Collocate tests with the code they cover.

| Layer     | Tool                  | Mock                               | Assert                                                                       |
| --------- | --------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| Model     | plain unit test       | the HTTP client                    | request URL/payload, response mapping, error paths, pure-function output     |
| ViewModel | `renderHook`          | the Model                          | returned state over time, callbacks call the Model correctly, derived values |
| View      | React Testing Library | the ViewModel hook, heavy children | rendered output per state, handler fired on interaction                      |

```ts
// Model — no React, no DOM
it('should post the payload to the orders endpoint', async () => {
  vi.mocked(http.post).mockResolvedValue({ data: order });
  await new OrderModel().create(payload);
  expect(http.post).toHaveBeenCalledWith(Endpoints.Orders, payload);
});

// ViewModel — Model faked
it('should expose only refundable orders', () => {
  vi.mocked(OrderModel.prototype.list).mockResolvedValue([fresh, stale]);
  const { result } = renderHook(() => useOrders(), { wrapper });
  await waitFor(() => expect(result.current.refundable).toEqual([fresh]));
});

// View — ViewModel faked
it('should call createOrder when the button is clicked', async () => {
  const createOrder = vi.fn();
  vi.mocked(useOrders).mockReturnValue({ ...base, createOrder });
  render(<OrdersView />);
  await userEvent.click(screen.getByRole('button', { name: /place order/i }));
  expect(createOrder).toHaveBeenCalled();
});
```

**Query by accessible role, label, or text — not test ids.** Tests that select by role
verify the thing a user (and a screen reader) can actually reach.

**If a layer is hard to test, the boundary is wrong.** A Model that needs a DOM, or a
View that needs an HTTP mock, is telling you something migrated to the wrong place.

---

## 7. Creating a New Feature

1. **Model first.** Define types, then the API surface, then pure domain functions.
   You should be able to unit test the whole feature's rules before any UI exists.
2. **ViewModel second.** Wrap the Model in caching/state. Decide the hook's return shape
   by writing the _call site_ you wish existed, then implement it.
3. **View last.** Consume the hook. If you find yourself needing data the hook doesn't
   expose, extend the hook — do not reach past it.
4. **Barrel + wiring.** Export the container View, register the route, register any
   new constants (endpoints, query keys) in the shared `Constants/`.
5. **Tests per layer**, collocated.

---

## 8. Review Checklist

Mechanical — each item is a grep or a glance, not a debate.

- [ ] No `import ... from 'react'` anywhere in `Model/`
- [ ] No JSX returned from `ViewModel/`
- [ ] No HTTP client, no `fetch`, no data transformation in `View/`
- [ ] Every ViewModel file exports a hook named `use*`
- [ ] No feature imports another feature's `Model/` or `ViewModel/`
- [ ] Multi-field global-store selectors use shallow comparison
- [ ] Query keys / endpoints come from shared constants, not inline strings
- [ ] Server data is not duplicated into a global client store
- [ ] `'use client'` sits on the lowest component that needs it
- [ ] Server Actions re-validate input and re-check authorization
- [ ] Each layer has a collocated test in its own style
- [ ] No `any` without a comment justifying it

---

## 9. Anti-Patterns

| Anti-pattern                                             | Why it hurts                                                            | Fix                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| "Smart View" — `useQuery` called inside a `.tsx`         | Untestable without network mocks; logic duplicates across views         | Move to the ViewModel                                                |
| "Anemic ViewModel" — hook returns raw server response    | View grows conditionals and formatting; the layer earns nothing         | Derive, format, and name things in the hook                          |
| "God ViewModel" — one hook for the whole page            | Every state change re-renders everything; the hook becomes unreviewable | Split by concern: `useOrderList`, `useOrderFilters`, `useOrderDraft` |
| Model importing React                                    | Breaks server reuse and pure testing                                    | Move the React part up to the ViewModel                              |
| Cross-feature ViewModel imports                          | Turns features into a graph; nothing can be deleted                     | Communicate via store, shared `lib/`, or props                       |
| Types defined next to the component that renders them    | Model can't reference them without an upward import                     | Types live in `Model/*Types.ts`                                      |
| Business rules inside JSX (`{order.total > 100 && ...}`) | Untested, undiscoverable, duplicated                                    | Named predicate in the Model, boolean exposed by the ViewModel       |
| Fetching in a `useEffect`                                | Race conditions, no caching, no dedup                                   | Server-state library in the ViewModel, or server-fetch in Next.js    |

---

## 10. When Not to Use MVVM

MVVM has a fixed per-feature overhead: three directories, a barrel, three test files.
That cost is worth paying when a feature has real domain logic, server interaction, or
more than one screen.

Skip it for: pure design-system components, one-off static marketing pages, and throwaway
prototypes. Those belong in `Components/` or a page file directly. Forcing ceremony onto
a stateless button helps no one — and a codebase where the pattern is applied only where
it pays is more convincing than one where it is applied everywhere by rule.

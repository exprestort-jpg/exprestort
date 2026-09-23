"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { type CheckoutState, createOrder } from "@/app/(shop)/checkout/actions";
import { cartTotalKop, useCart } from "@/lib/cart-store";
import { validateCheckoutField } from "@/lib/checkout-schema";
import { formatPrice } from "@/lib/money";
import styles from "./cart.module.css";
import { ComboBox, type ComboOption } from "./combo-box";

/**
 * When Nova Poshta is unreachable the field falls back to free text rather than
 * blocking the order. A manager confirms every order by phone anyway, so a
 * typed branch name is recoverable; a checkout that refuses to submit is not.
 */
const MANUAL_REF = "manual";

/**
 * `minLength` differs by field: a city needs a couple of letters to be worth
 * querying, but a branch is usually found by number — someone typing «1» for
 * «Відділення №1» must get results, and an empty box should already list the
 * city's branches.
 */
function useNpSearch(url: string | null, query: string, minLength: number) {
  const [options, setOptions] = useState<ComboOption[]>([]);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url || query.trim().length < minLength) {
      setOptions([]);
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${url}${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          setManual(true);
          setOptions([]);
          return;
        }
        setManual(false);
        setOptions(payload.cities ?? payload.warehouses ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setManual(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [url, query, minLength]);

  return { options, manual, loading };
}

export function CheckoutForm() {
  const hydrated = useCart((state) => state.hydrated);
  const lines = useCart((state) => state.lines);
  const clear = useCart((state) => state.clear);

  const [state, setState] = useState<CheckoutState>({});
  /*
   * Controlled on purpose: React resets uncontrolled inputs once a form action
   * settles, so a rejected phone number would also wipe the name the customer
   * had already typed.
   */
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
   * Re-checks one field as it is edited. `force` is for blur and submit; while
   * typing, only fields that already show an error are re-checked, so the form
   * corrects itself without nagging about a phone number half-entered.
   */
  function revalidate(
    field: "customerName" | "phone",
    value: string,
    force = false,
  ) {
    setErrors((previous) => {
      if (!force && !previous[field]) return previous;

      const message = validateCheckoutField(field, value);
      const next = { ...previous };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function clearErrors(...fields: string[]) {
    setErrors((previous) => {
      const next = { ...previous };
      for (const field of fields) delete next[field];
      return next;
    });
  }
  const [pending, startTransition] = useTransition();

  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState<ComboOption | null>(null);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [warehouse, setWarehouse] = useState<ComboOption | null>(null);

  const citySearch = useNpSearch(
    city ? null : "/api/np/cities?q=",
    cityQuery,
    2,
  );
  const warehouseSearch = useNpSearch(
    city && !warehouse ? `/api/np/warehouses?cityRef=${city.ref}&q=` : null,
    warehouseQuery,
    0,
  );

  if (state.orderNumber) {
    return (
      <div className={styles.success}>
        <p className={styles.successTitle}>
          Замовлення №{state.orderNumber} прийнято
        </p>
        <p className={styles.note}>
          Ми зв&apos;яжемося з вами найближчим часом, щоб підтвердити склад
          замовлення та відправлення.
        </p>
        <Link href="/catalog" className="buttonPrimary">
          Повернутись до каталогу
        </Link>
      </div>
    );
  }

  if (!hydrated) return <p className={styles.note}>Завантажуємо кошик…</p>;

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Кошик порожній — немає що оформлювати.</p>
        <Link href="/catalog" className="buttonPrimary">
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  function handleSubmit() {
    const payload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      npCityRef: city?.ref ?? (cityQuery.trim() ? MANUAL_REF : ""),
      npCityName: city?.name ?? cityQuery.trim(),
      npWarehouseRef:
        warehouse?.ref ?? (warehouseQuery.trim() ? MANUAL_REF : ""),
      npWarehouseName: warehouse?.name ?? warehouseQuery.trim(),
      comment: comment.trim(),
      lines: lines.map((line) => ({
        variantId: line.variantId,
        qty: line.qty,
      })),
    };

    startTransition(async () => {
      const result = await createOrder(payload);
      setState(result);
      setErrors(result.fieldErrors ?? {});
      if (result.orderNumber) clear();
    });
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      {state.error ? <p className={styles.formError}>{state.error}</p> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="customerName">
          Ім&apos;я та прізвище
        </label>
        <input
          id="customerName"
          name="customerName"
          className={styles.input}
          value={customerName}
          onChange={(event) => {
            setCustomerName(event.target.value);
            revalidate("customerName", event.target.value);
          }}
          onBlur={(event) =>
            revalidate("customerName", event.target.value, true)
          }
          required
        />
        {errors.customerName ? (
          <span className={styles.error}>{errors.customerName}</span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="067 000 00 00"
          className={styles.input}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            revalidate("phone", event.target.value);
          }}
          onBlur={(event) => revalidate("phone", event.target.value, true)}
          required
        />
        {errors.phone ? (
          <span className={styles.error}>{errors.phone}</span>
        ) : null}
      </div>

      <ComboBox
        id="city"
        label="Місто"
        placeholder="Почніть вводити назву"
        required
        minLength={2}
        query={cityQuery}
        onQueryChange={(value) => {
          setCity(null);
          setWarehouse(null);
          setWarehouseQuery("");
          setCityQuery(value);
        }}
        selected={city}
        onSelect={(option) => {
          setCity(option);
          clearErrors("npCityRef", "npCityName");
        }}
        options={citySearch.options}
        loading={citySearch.loading}
        manual={citySearch.manual}
        manualHint="Довідник Нової Пошти недоступний — впишіть місто вручну."
        error={errors.npCityName ?? errors.npCityRef}
      />

      <ComboBox
        id="warehouse"
        label="Відділення Нової Пошти"
        placeholder={
          city ? "Номер або адреса відділення" : "Спочатку оберіть місто"
        }
        disabled={!city}
        required
        minLength={0}
        query={warehouseQuery}
        onQueryChange={(value) => {
          setWarehouse(null);
          setWarehouseQuery(value);
        }}
        selected={warehouse}
        onSelect={(option) => {
          setWarehouse(option);
          clearErrors("npWarehouseRef", "npWarehouseName");
        }}
        options={warehouseSearch.options}
        loading={warehouseSearch.loading}
        manual={warehouseSearch.manual}
        manualHint="Довідник недоступний — впишіть відділення вручну."
        error={errors.npWarehouseName ?? errors.npWarehouseRef}
      />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="comment">
          Коментар до замовлення
        </label>
        <textarea
          id="comment"
          name="comment"
          className={styles.textarea}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Разом</span>
          <span className={styles.summaryTotal}>
            {formatPrice(cartTotalKop(lines))}
          </span>
        </div>
        <p className={styles.note}>
          Оплата не онлайн: менеджер зв&apos;яжеться з вами для підтвердження.
          Доставка — за тарифами Нової Пошти.
        </p>
        <button
          type="submit"
          className="buttonPrimary buttonBlock"
          disabled={pending}
        >
          {pending ? "Надсилаємо…" : "Підтвердити замовлення"}
        </button>
      </div>
    </form>
  );
}

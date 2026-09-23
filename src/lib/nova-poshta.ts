import { cacheLife, cacheTag } from "next/cache";

/*
 * Nova Poshta rejects numeric Limit/Page with "Page is invalid format" — the
 * API expects these as strings, despite being numbers everywhere else.
 */
const API_URL = "https://api.novaposhta.ua/v2.0/json/";

export type NpCity = { ref: string; name: string; area: string };
export type NpWarehouse = { ref: string; name: string; number: string };

export type NpFailure = "not-configured" | "bad-key" | "unavailable";

export type NpResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: NpFailure };

/**
 * Failures must never be cached. A `use cache` scope stores whatever it
 * returns, so returning a failure from inside one pins the outage — or a
 * rejected key — for the whole cacheLife, and replacing the key changes
 * nothing until that expires. A throw is not stored, so the cached layer
 * throws and the exported wrapper turns it back into a result.
 *
 * The reason travels in the message because an error crossing a cache boundary
 * is reconstructed: the class is lost, the message survives.
 */
const FAILURE_PREFIX = "np-failure:";

function failureError(reason: NpFailure): Error {
  return new Error(`${FAILURE_PREFIX}${reason}`);
}

function toFailure<T>(error: unknown): NpResult<T> {
  const message = error instanceof Error ? error.message : String(error);
  const reason = message.split(FAILURE_PREFIX)[1]?.trim() as
    | NpFailure
    | undefined;
  return {
    ok: false,
    reason:
      reason === "bad-key" || reason === "not-configured"
        ? reason
        : "unavailable",
  };
}

type NpApiResponse<T> = {
  success: boolean;
  data: T[];
  errors: string[];
};

async function call<T>(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown>,
): Promise<NpResult<T[]>> {
  const apiKey = process.env.NP_API_KEY;
  if (!apiKey) return { ok: false, reason: "not-configured" };

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        modelName,
        calledMethod,
        methodProperties,
      }),
    });
  } catch (error) {
    console.error("Nova Poshta request failed", error);
    return { ok: false, reason: "unavailable" };
  }

  // A rejected key answers 401; anything else is an outage on their side.
  if (response.status === 401) {
    console.error("Nova Poshta rejected NP_API_KEY — generate a new one");
    return { ok: false, reason: "bad-key" };
  }

  if (!response.ok) {
    console.error(`Nova Poshta responded ${response.status}`);
    return { ok: false, reason: "unavailable" };
  }

  const payload = (await response.json()) as NpApiResponse<T>;

  if (!payload.success) {
    const message = payload.errors?.join("; ") ?? "";
    // They also report a bad key with HTTP 200 and this message.
    if (/api key/i.test(message)) {
      console.error("Nova Poshta rejected NP_API_KEY — generate a new one");
      return { ok: false, reason: "bad-key" };
    }
    console.error("Nova Poshta request unsuccessful:", message);
    return { ok: false, reason: "unavailable" };
  }

  return { ok: true, data: payload.data };
}

/**
 * Cached hard: the settlement list changes a few times a year, and every
 * keystroke in the checkout would otherwise be a round trip to Nova Poshta.
 */
async function cachedCities(query: string): Promise<NpCity[]> {
  "use cache";
  cacheLife("days");
  cacheTag("np-cities");

  const result = await call<{
    Ref: string;
    Description: string;
    AreaDescription?: string;
  }>("Address", "getCities", { FindByString: query, Limit: "20", Page: "1" });

  if (!result.ok) throw failureError(result.reason);

  return result.data.map((row) => ({
    ref: row.Ref,
    name: row.Description,
    area: row.AreaDescription ?? "",
  }));
}

export async function searchCities(query: string): Promise<NpResult<NpCity[]>> {
  try {
    return { ok: true, data: await cachedCities(query) };
  } catch (error) {
    return toFailure(error);
  }
}

/**
 * Fetches a city's branches once and caches them; filtering happens locally.
 *
 * Nova Poshta's own search is not usable here. FindByString matches the whole
 * description rather than the branch number, and it is flaky — the identical
 * query returned 50 results and then 0 on consecutive calls. Their paging does
 * not work either: `Page` is ignored and `Limit` is capped at 500, so this is
 * genuinely one request per city, not laziness.
 *
 * Consequence: in cities with more than 500 branches the tail is unreachable.
 * The checkout keeps free-text entry for exactly that case, and a manager
 * confirms every order by phone anyway.
 */
async function cachedWarehouses(cityRef: string): Promise<NpWarehouse[]> {
  "use cache";
  cacheLife("days");
  cacheTag("np-warehouses");

  const result = await call<{
    Ref: string;
    Description: string;
    Number: string;
  }>("Address", "getWarehouses", { CityRef: cityRef, Limit: "500", Page: "1" });

  if (!result.ok) throw failureError(result.reason);

  return result.data.map((row) => ({
    ref: row.Ref,
    name: row.Description,
    number: row.Number,
  }));
}

/** Ranks a branch against the typed query. Lower sorts first. */
function rankWarehouse(
  warehouse: NpWarehouse,
  query: string,
  numeric: boolean,
): number {
  if (numeric) {
    if (warehouse.number === query) return 0;
    if (warehouse.number.startsWith(query)) return 1;
  }
  return warehouse.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 3;
}

export async function listWarehouses(
  cityRef: string,
  query = "",
): Promise<NpResult<NpWarehouse[]>> {
  try {
    const all = await cachedWarehouses(cityRef);
    const trimmed = query.trim();

    if (!trimmed) return { ok: true, data: all.slice(0, 50) };

    const numeric = /^\d+$/.test(trimmed);
    const matches = all
      .map((warehouse) => ({
        warehouse,
        rank: rankWarehouse(warehouse, trimmed, numeric),
      }))
      .filter((entry) => entry.rank < 99)
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          Number(a.warehouse.number) - Number(b.warehouse.number),
      )
      .slice(0, 50)
      .map((entry) => entry.warehouse);

    return { ok: true, data: matches };
  } catch (error) {
    return toFailure(error);
  }
}

/** Maps a failure to the HTTP status and code the checkout form understands. */
export function npFailureResponse(
  reason: NpFailure,
  key: "cities" | "warehouses",
): Response {
  const status = reason === "unavailable" ? 502 : 503;
  return Response.json({ error: `np-${reason}`, [key]: [] }, { status });
}

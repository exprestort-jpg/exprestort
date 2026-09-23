import type { ZodError } from "zod";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set by forms that stay on the page instead of redirecting after a save. */
  saved?: boolean;
};

/** Flattens a Zod error into one message per field, which is all the UI shows. */
export function toFieldErrors(error: ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { fieldErrors };
}

/**
 * Drizzle wraps driver errors in a DrizzleQueryError and hangs the original off
 * `cause`, so the Postgres SQLSTATE is never on the error you actually catch.
 * Walk the chain to find it.
 */
function sqlStateOf(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (
      typeof current === "object" &&
      "code" in current &&
      typeof current.code === "string"
    ) {
      return current.code;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

/** Raised when a slug is already taken. */
export function isUniqueViolation(error: unknown): boolean {
  return sqlStateOf(error) === "23505";
}

/**
 * Raised when deleting a row that is still referenced. `ON DELETE RESTRICT`
 * reports 23001 (restrict_violation); plain `NO ACTION` reports 23503. Both
 * mean the same thing to the person clicking Delete.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  const code = sqlStateOf(error);
  return code === "23503" || code === "23001";
}

export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export function num(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

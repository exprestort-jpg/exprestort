"use client";

import { useState } from "react";
import type { ZodObject, ZodType } from "zod";
import type { FormState } from "./form";

type AnyObjectSchema = ZodObject<Record<string, ZodType>>;

/** Returns the first message for a single field, or null when it is fine. */
export function fieldError(
  schema: AnyObjectSchema,
  field: string,
  value: unknown,
): string | null {
  const shape = schema.shape[field];
  if (!shape) return null;

  const result = shape.safeParse(value);
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? "Некоректне значення");
}

type ChangeTarget = { target: { value: string } };

/**
 * State for an admin form.
 *
 * Every field is controlled. React resets *uncontrolled* inputs once a form
 * action settles, so with `defaultValue` a single rejected field would wipe
 * everything else the admin had typed. Nothing here ever clears a value on its
 * own — a failed save shows messages and leaves the input alone.
 *
 * Validation runs on every keystroke, but only for fields that already show an
 * error; a half-typed value is not yet wrong. Blur and the server response
 * check unconditionally, so a field that becomes valid stops complaining
 * immediately rather than waiting for the next submit.
 */
export function useAdminForm<T extends Record<string, string>>({
  initial,
  schema,
  state,
}: {
  initial: T;
  schema: AnyObjectSchema;
  state: FormState;
}) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
   * Adopting the server's errors during render rather than in an effect keeps
   * them from flashing in a frame after the form has already re-rendered.
   */
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setErrors(state.fieldErrors ?? {});
  }

  function validate(field: string, value: string, force: boolean) {
    setErrors((previous) => {
      if (!force && !previous[field]) return previous;

      const message = fieldError(schema, field, value);
      const next = { ...previous };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function setValue(field: keyof T & string, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    validate(field, value, false);
  }

  /**
   * For fields the object schema does not describe — repeater rows, whose keys
   * carry an index (`variants.0.price`). Pass null to clear.
   */
  function setError(key: string, message: string | null) {
    setErrors((previous) => {
      if (!message && !previous[key]) return previous;
      const next = { ...previous };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  /** Spread onto an input, textarea or select to wire name, value and checks. */
  function field(name: keyof T & string) {
    return {
      name,
      id: name,
      value: values[name],
      onChange: (event: ChangeTarget) => setValue(name, event.target.value),
      onBlur: (event: ChangeTarget) => validate(name, event.target.value, true),
    };
  }

  return { values, errors, setValue, setValues, validate, setError, field };
}

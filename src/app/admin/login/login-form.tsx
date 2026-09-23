"use client";

import { useActionState } from "react";
import { type LoginState, loginAction } from "./actions";
import styles from "./login.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className={styles.form}>
      <h1 className={styles.title}>Експрес-торт</h1>
      <p className={styles.subtitle}>Панель адміністратора</p>

      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        className={styles.input}
      />

      <label className={styles.label} htmlFor="password">
        Пароль
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={styles.input}
      />

      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Входимо…" : "Увійти"}
      </button>
    </form>
  );
}

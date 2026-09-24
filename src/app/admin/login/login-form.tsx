"use client";

import { useActionState, useState } from "react";
import { type LoginState, loginAction } from "./actions";
import styles from "./login.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  /*
   * Controlled so a rejected sign-in leaves both fields as typed: React clears
   * uncontrolled inputs once a form action settles, and retyping an email after
   * a mistyped password is pure friction.
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        value={email}
        onChange={(event) => setEmail(event.target.value)}
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
        value={password}
        onChange={(event) => setPassword(event.target.value)}
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

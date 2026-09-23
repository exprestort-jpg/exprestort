"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
    return {};
  } catch (error) {
    // signIn throws NEXT_REDIRECT on success — that has to keep propagating.
    if (error instanceof AuthError) {
      return { error: "Невірний email або пароль" };
    }
    throw error;
  }
}

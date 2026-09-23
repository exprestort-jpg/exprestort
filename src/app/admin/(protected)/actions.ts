"use server";

import { signOut } from "@/lib/auth";
import { assertAdmin } from "@/lib/require-admin";

export async function logoutAction() {
  await assertAdmin();
  await signOut({ redirectTo: "/admin/login" });
}

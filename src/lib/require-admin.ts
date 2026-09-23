import { redirect } from "next/navigation";
import { auth } from "./auth";

/** For admin pages and layouts: bounce to the login screen. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  return session.user;
}

/**
 * For server actions and route handlers. Server Actions are reachable by direct
 * POST, so the proxy redirect above protects nothing here — every action must
 * call this itself.
 */
export async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

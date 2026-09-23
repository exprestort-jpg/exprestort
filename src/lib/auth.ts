import { hash, verify } from "@node-rs/argon2";
import { and, eq, gte, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { adminUsers, loginAttempts } from "@/db/schema";
import { authCookies } from "./auth-cookies";

/** OWASP-recommended argon2id parameters. */
export const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string) {
  return hash(password, ARGON2_OPTIONS);
}

const LOCKOUT_WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 10;
const MAX_FAILURES_PER_IP = 30;

async function isLockedOut(email: string, ip: string) {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);

  const [byEmail, byIp] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, since),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ip, ip),
          eq(loginAttempts.success, false),
          gte(loginAttempts.createdAt, since),
        ),
      ),
  ]);

  return (
    (byEmail[0]?.n ?? 0) >= MAX_FAILURES_PER_EMAIL ||
    (byIp[0]?.n ?? 0) >= MAX_FAILURES_PER_IP
  );
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  cookies: authCookies,
  session: {
    strategy: "jwt",
    // Sliding window: 30 days of absolute life, refreshed whenever the session
    // is used and is more than a day old. Someone who logs in and keeps working
    // stays logged in; 30 idle days signs them out.
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        const ip = clientIp(request);

        if (!email || !password) return null;
        if (await isLockedOut(email, ip)) return null;

        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, email))
          .limit(1);

        // Hash a dummy value when the account is missing so that a wrong email
        // and a wrong password take the same amount of time to reject.
        const passwordHash =
          user?.passwordHash ??
          "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000";

        let ok = false;
        try {
          ok = await verify(passwordHash, password, ARGON2_OPTIONS);
        } catch {
          ok = false;
        }
        const success = ok && Boolean(user);

        await db.insert(loginAttempts).values({ email, ip, success });

        // Never reveal which half was wrong.
        if (!success || !user) return null;

        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

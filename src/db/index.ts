import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * Default client. Uses Neon's HTTP driver: one round trip per query, no
 * connection to keep alive, which is what serverless invocations want.
 * It cannot run transactions — use `withTransaction` for those.
 */
export const db = drizzle(neon(connectionString), { schema });

neonConfig.webSocketConstructor = ws;

/**
 * Opens a real transaction over a WebSocket pool. Only worth it where several
 * writes must succeed or fail together (creating an order and its items).
 */
export async function withTransaction<T>(
  fn: (
    tx: Parameters<
      Parameters<ReturnType<typeof drizzleWs>["transaction"]>[0]
    >[0],
  ) => Promise<T>,
): Promise<T> {
  const pool = new Pool({ connectionString });
  try {
    return await drizzleWs(pool, { schema }).transaction(fn);
  } finally {
    await pool.end();
  }
}

export { schema };

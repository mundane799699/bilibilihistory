import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

function getPoolMax(): number {
  const configuredMax = Number.parseInt(
    process.env.DATABASE_POOL_MAX ?? "",
    10,
  );

  return Number.isInteger(configuredMax) && configuredMax > 0
    ? configuredMax
    : 3;
}

const globalForPostgres = globalThis as typeof globalThis & {
  bilibiliHistoryPool?: Pool;
};

function createPool(): Pool {
  const createdPool = new Pool({
    connectionString,
    max: getPoolMax(),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    application_name: "bilibili-history-web",
  });

  if (process.env.VERCEL === "1") {
    attachDatabasePool(createdPool);
  }

  return createdPool;
}

// Reuse the pool across route modules and Next.js hot reloads in the same process.
export const pool =
  globalForPostgres.bilibiliHistoryPool ??
  (globalForPostgres.bilibiliHistoryPool = createPool());

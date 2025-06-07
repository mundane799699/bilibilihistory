import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// 禁用预处理语句以避免与某些连接池的问题
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);

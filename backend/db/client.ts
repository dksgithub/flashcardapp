import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const dbPassword = process.env.POSTGRES_PASSWORD;

const connectionString =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${encodeURIComponent(dbPassword ?? "")}@${process.env.POSTGRES_HOST ?? "127.0.0.1"}:${process.env.POSTGRES_PORT ?? "5432"}/${process.env.POSTGRES_DB ?? "flashycardy"}`;

if (!process.env.DATABASE_URL && !dbPassword) {
  throw new Error("Missing database credentials: set DATABASE_URL or POSTGRES_PASSWORD.");
}

export const client = postgres(connectionString, {
  ssl: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);
export const sql = client;

export default db;

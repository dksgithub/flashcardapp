import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbPassword = process.env.POSTGRES_PASSWORD;

if (!process.env.DATABASE_URL && !dbPassword) {
  throw new Error("Missing database credentials: set DATABASE_URL or POSTGRES_PASSWORD.");
}

const dbUrl =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${encodeURIComponent(dbPassword ?? "")}@${process.env.POSTGRES_HOST ?? "127.0.0.1"}:${process.env.POSTGRES_PORT ?? "5432"}/${process.env.POSTGRES_DB ?? "flashycardy"}`;

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import "dotenv/config";

const dbName = process.env.POSTGRES_DB ?? "flashycardy";
const dbUser = process.env.POSTGRES_USER ?? "postgres";
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbHost = process.env.POSTGRES_HOST ?? "127.0.0.1";
const dbPort = Number(process.env.POSTGRES_PORT ?? "5432");

if (!dbPassword) {
  throw new Error("Missing POSTGRES_PASSWORD. Set it in your environment or .env before running setup.");
}

const adminClient = new Client({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: "postgres",
});

async function ensureDatabase() {
  await adminClient.connect();

  const result = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );

  if (result.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }
}

async function ensureSchema() {
  const schemaSql = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();
    await client.query(schemaSql);
    console.log("Applied schema.sql");
  } finally {
    await client.end();
  }
}

try {
  await ensureDatabase();
  await ensureSchema();
} catch (error) {
  console.error("Database setup failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await adminClient.end().catch(() => {});
}

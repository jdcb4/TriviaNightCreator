import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const isProduction = process.env.NODE_ENV === "production" || !!process.env.PORT;

if (!process.env.DATABASE_URL) {
  if (isProduction) {
    throw new Error("CRITICAL ERROR: The 'DATABASE_URL' environment variable is missing in the production container! Please ensure you have added the DATABASE_URL variable in your Railway service settings.");
  } else {
    console.warn("WARNING: DATABASE_URL environment variable is not defined. Falling back to local dev PostgreSQL database.");
  }
}

const dbUrl = process.env.DATABASE_URL || "postgres://postgres:postgrespassword@localhost:5432/trivia_night";

export const pool = new pg.Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const dbUrl = process.env.DATABASE_URL || "postgres://postgres:postgrespassword@localhost:5432/trivia_night";

export const pool = new pg.Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;

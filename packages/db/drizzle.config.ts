import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

const dbUrl = process.env.DATABASE_URL || "postgres://postgres:postgrespassword@localhost:5432/trivia_night";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: dbUrl,
  },
} satisfies Config;

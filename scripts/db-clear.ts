import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";

import { getDb } from "../src/db";
import { expenses } from "../src/db/schema";

loadEnvConfig(process.cwd());

async function main() {
  const db = getDb();

  await db.delete(expenses);
  await db.execute(sql`ALTER SEQUENCE expenses_id_seq RESTART WITH 1`);

  console.log("Database cleared: deleted all expense data and kept the schema and migration tables intact.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

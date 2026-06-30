import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client =
    globalForDb.postgresClient ??
    postgres(databaseUrl, {
      prepare: false,
    });

  const db = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgresClient = client;
    globalForDb.db = db;
  }

  return db;
}

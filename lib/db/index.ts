import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Reuse one client across hot reloads in dev so connections don't pile up.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

// prepare: false is required by Supabase's transaction pooler.
const client = globalForDb.pgClient ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });

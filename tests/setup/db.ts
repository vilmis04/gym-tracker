import { afterAll, beforeEach, inject } from "vitest";

import { closeDatabase, resetDatabase } from "../helpers/db";

// Settings resolved once in tests/setup/db-global.ts. Expose them the way the
// app reads them, so tests exercise the real helpers in src/lib/supabase.
const supabase = inject("supabase");
process.env.NEXT_PUBLIC_SUPABASE_URL = supabase.url;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabase.anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = supabase.serviceRoleKey;
process.env.SUPABASE_JWT_SECRET = supabase.jwtSecret;
process.env.SUPABASE_DB_URL = supabase.dbUrl;

// Known state for every test: user-data tables are empty (see tests/README.md).
beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

import { Client, type QueryResultRow } from "pg";

/**
 * Tables that hold reference data from `supabase/seed.sql` (tags, common
 * machines, …) and must survive a reset. Every other table in `public` is
 * treated as user data and emptied before each DB test.
 */
const SEEDED_TABLES: readonly string[] = [];

let client: Client | undefined;

async function getClient(): Promise<Client> {
  if (!client) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error(
        "SUPABASE_DB_URL is not set; DB helpers only work in the `db` Vitest project.",
      );
    }
    client = new Client({ connectionString });
    await client.connect();
  }
  return client;
}

/**
 * Empties every user-data table in `public` (all tables except
 * {@link SEEDED_TABLES}) with one `truncate … restart identity cascade`, as
 * the `postgres` superuser so RLS doesn't get in the way.
 *
 * Called before each test in the `db` project (tests/setup/db.ts), so tests
 * never see rows from another test and don't depend on run order. New tables
 * are picked up automatically; add seeded reference tables to the list.
 */
export async function resetDatabase(): Promise<void> {
  const db = await getClient();
  const { rows } = await db.query<{ name: string }>(
    `select format('%I.%I', schemaname, tablename) as name
       from pg_tables
      where schemaname = 'public' and not (tablename = any($1))`,
    [SEEDED_TABLES],
  );
  if (rows.length === 0) return;
  await db.query(
    `truncate ${rows.map((row) => row.name).join(", ")} restart identity cascade`,
  );
}

/**
 * Runs SQL as the `postgres` superuser, e.g. to create a test-only fixture
 * table (tests/db/rls/third-party-auth.test.ts) or to inspect the catalog.
 * Never use it as the actor under test: it bypasses RLS.
 */
export async function queryAsSuperuser<Row extends QueryResultRow>(
  statement: string,
  values: unknown[] = [],
): Promise<Row[]> {
  const db = await getClient();
  const { rows } = await db.query<Row>(statement, values);
  return rows;
}

/** Closes the connection opened by {@link resetDatabase}. */
export async function closeDatabase(): Promise<void> {
  await client?.end();
  client = undefined;
}

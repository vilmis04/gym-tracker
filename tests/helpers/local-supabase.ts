import { execFileSync } from "node:child_process";

/** Connection settings for the Supabase stack the DB tests run against. */
export type LocalSupabaseEnv = {
  /** API URL, e.g. `http://127.0.0.1:54321`. */
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  /** HS256 secret Supabase uses to verify JWTs (`auth.jwt()`). */
  jwtSecret: string;
  /** Postgres connection string, used to reset tables between tests. */
  dbUrl: string;
};

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/**
 * Resolves the local Supabase settings for DB tests.
 *
 * 1. If all of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
 *    `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` and `SUPABASE_DB_URL`
 *    are set (CI), they are used as-is.
 * 2. Otherwise the values are read from `supabase status -o env`, so locally
 *    `npm run db:start && npm run test:db` needs no setup.
 *
 * Refuses non-local hosts: the tests truncate tables, so they must never point
 * at a staging or production project.
 *
 * @throws {Error} When the stack isn't running or a URL isn't local.
 */
export function resolveLocalSupabaseEnv(): LocalSupabaseEnv {
  const fromProcess = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    dbUrl: process.env.SUPABASE_DB_URL,
  };

  const env = isComplete(fromProcess) ? fromProcess : readSupabaseStatus();
  assertLocal("API URL", env.url);
  assertLocal("database URL", env.dbUrl);
  return env;
}

function isComplete(
  env: Partial<Record<keyof LocalSupabaseEnv, string | undefined>>,
): env is LocalSupabaseEnv {
  return Object.values(env).every(Boolean);
}

function readSupabaseStatus(): LocalSupabaseEnv {
  let output: string;
  try {
    output = execFileSync("npx", ["supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      "Could not read the local Supabase settings. Start the stack with `npm run db:start` (needs Docker), or set the SUPABASE_* variables listed in tests/README.md.",
      { cause: error },
    );
  }

  const values = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line.trim());
    if (match?.[1] && match[2] !== undefined) values.set(match[1], match[2]);
  }

  const env = {
    url: values.get("API_URL"),
    anonKey: values.get("ANON_KEY"),
    serviceRoleKey: values.get("SERVICE_ROLE_KEY"),
    jwtSecret: values.get("JWT_SECRET"),
    dbUrl: values.get("DB_URL"),
  };
  if (!isComplete(env)) {
    throw new Error(
      "`supabase status -o env` did not print API_URL, ANON_KEY, SERVICE_ROLE_KEY, JWT_SECRET and DB_URL. Is the stack running (`npm run db:status`)?",
    );
  }
  return env;
}

function assertLocal(label: string, value: string): void {
  const { hostname } = new URL(value);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `DB tests only run against a local Supabase stack, but the ${label} host is "${hostname}". They truncate tables, so never point them at staging or production.`,
    );
  }
}

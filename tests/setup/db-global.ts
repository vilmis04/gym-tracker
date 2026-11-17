import {
  resolveLocalSupabaseEnv,
  type LocalSupabaseEnv,
} from "../helpers/local-supabase";

import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    supabase: LocalSupabaseEnv;
  }
}

/**
 * Runs once before the `db` project: resolves the local Supabase settings and
 * hands them to the test workers (read in tests/setup/db.ts via `inject`).
 */
export default function setup(project: TestProject): void {
  project.provide("supabase", resolveLocalSupabaseEnv());
}

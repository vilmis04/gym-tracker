"use server";

import { auth } from "@clerk/nextjs/server";

import { withAction } from "@/lib/actions/with-action";
import { isClerkConfigured } from "@/lib/auth/clerk-env";
import { AppError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";

import { preferencesInputSchema } from "./preferences-input-schema";

/**
 * Saves the signed-in user's language and/or theme to their profile
 * (E04-T04), so they follow the user to other devices. Called after the
 * change has already been applied on this device (`NEXT_LOCALE` cookie,
 * next-themes' local storage).
 *
 * The user comes from the Clerk session, never from the input, and the
 * update runs through RLS as that user (column grant: `locale`, `theme`).
 * Returns nothing: the caller only needs to know whether it worked.
 *
 * - Signed out or without Clerk keys → `UNAUTHORIZED`
 * - Unsupported value or empty input → `VALIDATION`
 * - No own profile row (deleted meanwhile) → `NOT_FOUND`
 */
export const savePreferences = withAction(
  preferencesInputSchema,
  async ({ locale, theme }) => {
    if (!isClerkConfigured()) throw new AppError("UNAUTHORIZED");
    const { userId } = await auth();
    if (!userId) throw new AppError("UNAUTHORIZED");

    const { error } = await createServerClient()
      .from("profiles")
      .update({ locale, theme })
      // RLS already limits the update to the own row; the filter is still
      // required (pg-safeupdate refuses an update without `where`).
      .eq("id", userId)
      // `.single()` turns "no row updated" into PGRST116 → NOT_FOUND.
      .select("id")
      .single();
    if (error) throw error;
  },
);

"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { showToast } from "@/components/ui/toast";
import type { MessageKey } from "@/lib/i18n/i18n.types";

import { subscribeToPreferenceSaveOutcomes } from "./preference-saving";

import type { PreferenceSaveOutcome } from "./preferences.types";

/**
 * The short confirmation after a language or theme change in the signed-in
 * area (E04-T04): "Saved", or "Couldn't sync …" when saving to the profile
 * failed (the change still applies on this device). One toast at a time,
 * replaced by the next change. Mounted once in the `(app)` layout; renders
 * nothing itself (the toasts appear in the root layout's `Toaster`).
 */
export function PreferenceSaveToast() {
  const translate = useTranslations("common");

  useEffect(
    () =>
      subscribeToPreferenceSaveOutcomes((outcome) => {
        showToast(translate(OUTCOME_MESSAGE_KEYS[outcome]), {
          id: PREFERENCE_SAVE_TOAST_ID,
        });
      }),
    [translate],
  );

  return null;
}

const OUTCOME_MESSAGE_KEYS = {
  saved: "preferencesSaved",
  failed: "preferencesNotSaved",
} as const satisfies Record<PreferenceSaveOutcome, MessageKey<"common">>;

const PREFERENCE_SAVE_TOAST_ID = "preference-save";

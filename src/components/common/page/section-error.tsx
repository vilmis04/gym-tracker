"use client";

import * as Sentry from "@sentry/nextjs";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import { PageHeader } from "./page-header";

import type { SectionErrorProps } from "./section-error.types";

/**
 * The friendly error page of an app section (each section's `error.tsx`,
 * E02-T06). It replaces only the page, so the navigation and the avatar
 * menu keep working. Reports the error like `global-error.tsx`; the message
 * is never shown (in production it is a generic digest anyway).
 */
export function SectionError({ error, retry, titleKey }: SectionErrorProps) {
  const translateNav = useTranslations("nav");
  const translateErrors = useTranslations("errors");
  const translateCommon = useTranslations("common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <>
      <PageHeader title={translateNav(titleKey)} />
      <div
        role="alert"
        className="flex flex-col items-center gap-4 px-4 py-10 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-surface text-destructive">
          <TriangleAlert aria-hidden="true" size={20} strokeWidth={1.5} />
        </span>
        <h2 className="text-lg font-semibold">
          {translateErrors("pageTitle")}
        </h2>
        <p className="max-w-xs text-base text-muted-foreground">
          {translateErrors("pageDescription")}
        </p>
        <Button variant="secondary" onClick={() => retry()}>
          {translateCommon("tryAgain")}
        </Button>
      </div>
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state of an app page (`loading.tsx`, E02-T06), shaped like a
 * typical page: the header row (title and avatar button), a card and a few
 * list rows. Screen readers hear "Loading" once; the blocks are hidden.
 */
export function PageSkeleton() {
  const translate = useTranslations("common");

  return (
    <div aria-busy="true" className="flex flex-col gap-7 lg:gap-9">
      <span role="status" className="sr-only">
        {translate("loading")}
      </span>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="size-11 rounded-full" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="flex flex-col gap-3">
        {SKELETON_ROW_KEYS.map((rowKey) => (
          <Skeleton key={rowKey} className="h-14" />
        ))}
      </div>
    </div>
  );
}

const SKELETON_ROW_KEYS = ["first", "second", "third"] as const;

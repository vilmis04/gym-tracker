"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { AccountMenu } from "@/components/common/app-shell/account-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

import type { PageHeaderProps } from "./page-header.types";

/**
 * The header of every app page (E02-T06): the title as `<h1>`, a back button
 * on detail pages, and the avatar menu (language, theme, settings) on the
 * right.
 */
export function PageHeader({ title, backHref }: PageHeaderProps) {
  const translate = useTranslations("common");
  const isDetailPage = backHref !== undefined;

  return (
    <header className="flex min-h-11 items-center gap-2">
      {isDetailPage && (
        <Button variant="ghost" size="icon" asChild className="-ml-3">
          <Link href={backHref} aria-label={translate("back")}>
            <ChevronLeft aria-hidden="true" size={24} strokeWidth={1.5} />
          </Link>
        </Button>
      )}
      <h1
        className={cn(
          "min-w-0 flex-1 font-semibold tracking-tight break-words",
          isDetailPage ? "text-lg lg:text-2xl" : "text-2xl lg:text-3xl",
        )}
      >
        {title}
      </h1>
      <AccountMenu />
    </header>
  );
}

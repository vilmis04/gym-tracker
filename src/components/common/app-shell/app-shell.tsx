import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { FOCUS_RING_CLASS_NAME } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils/cn";

import { BottomNav, SidebarNav } from "./main-nav";

/**
 * The signed-in app's frame (E02-T06). Below 1024 px: the page and a fixed
 * bottom navigation; from 1024 px: a 216 px sidebar with the app name and
 * the same items, and the page capped at 1180 px. Which one shows is pure
 * CSS (`lg:`), so server and client render the same markup. Each page draws
 * its own header with `PageHeader`. On phones the page is padded by the
 * safe-area insets (notch, rounded corners in landscape), since the root
 * viewport uses `viewport-fit=cover`.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const translate = await getTranslations("common");

  return (
    <div data-app-shell="" className="flex min-h-dvh flex-1">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className={cn(
          "fixed top-2 left-2 z-50 -translate-y-20 rounded-md bg-background px-4 py-3 text-sm font-medium focus-visible:translate-y-0",
          FOCUS_RING_CLASS_NAME,
        )}
      >
        {translate("skipToContent")}
      </a>
      <aside className="sticky top-0 hidden h-dvh w-54 shrink-0 flex-col gap-7 overflow-y-auto border-r border-border px-4 py-7 lg:flex">
        <span className="px-3 text-base font-semibold">
          {translate("appName")}
        </span>
        <SidebarNav />
      </aside>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex w-full max-w-content min-w-0 flex-col gap-7 pt-[calc(1.75rem+env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[calc(var(--bottom-nav-inset)+1.75rem)] pl-[max(1rem,env(safe-area-inset-left,0px))] outline-none lg:gap-9 lg:px-6 lg:py-9 xl:px-12"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

const MAIN_CONTENT_ID = "main-content";

"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { FOCUS_RING_CLASS_NAME } from "./focus-ring";

/**
 * Underline tabs (E02-T03) as on the mock-ups' Sessions page, on Radix Tabs:
 * Tab focuses the active tab, ← / → (Home / End) move between tabs and show
 * their panel. Counts go in the label ("Invitations · 2"), never as badges.
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex gap-6 border-b border-border", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "-mb-px h-11 min-w-11 shrink-0 cursor-pointer border-b-2 border-transparent text-base font-normal whitespace-nowrap text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground",
        "data-[state=active]:border-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        FOCUS_RING_CLASS_NAME,
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("pt-4", FOCUS_RING_CLASS_NAME, className)}
      {...props}
    />
  );
}

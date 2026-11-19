import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names and resolves Tailwind conflicts, so a component's own
 * classes can be overridden from outside: `cn("px-4", className)` with
 * `className="px-6"` gives `"px-6"` (the shadcn/ui `cn` helper).
 */
export function cn(...classNames: ClassValue[]): string {
  return twMerge(clsx(classNames));
}

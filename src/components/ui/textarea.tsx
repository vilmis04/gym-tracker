import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { FIELD_CLASS_NAME } from "./input";

/** Multi-line text input (E02-T03), styled like Input; grows vertically only. */
export function Textarea({
  className,
  rows = 4,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(FIELD_CLASS_NAME, "min-h-28 resize-y px-4 py-3", className)}
      {...props}
    />
  );
}

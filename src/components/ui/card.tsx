import { type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

interface CardProps extends ComponentProps<"div"> {
  /** `soft`: the primary tint, for the one highlighted card (active session on Home). */
  variant?: "default" | "soft";
}

/**
 * Card (E02-T03): a filled block, no border and no shadow (borders over
 * shadows; the fill separates it). 20 px radius as in the mock-ups. Compose
 * with CardHeader / CardTitle / CardDescription / CardContent / CardFooter.
 */
export function Card({ variant = "default", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl p-5 text-card-foreground",
        variant === "soft" ? "bg-primary-soft" : "bg-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

/** A heading: pick the level that fits the page outline with `as`. */
export function CardTitle({
  as: Heading = "h3",
  className,
  ...props
}: ComponentProps<"h3"> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <Heading
      className={cn("text-xl font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

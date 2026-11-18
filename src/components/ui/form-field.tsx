import { Slot } from "radix-ui";
import { useId } from "react";

import { cn } from "@/lib/utils/cn";

import { Label } from "./label";

import type { FormFieldProps } from "./form-field.types";

/**
 * Label + control + help text + error (E02-T03). Wires the accessibility
 * attributes onto its single child, so any control works:
 *
 * ```tsx
 * <FormField label="Name" help="Shown to your buddies" error={errors.name}>
 *   <Input name="name" />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  help,
  error = null,
  isLabelHidden = false,
  className,
  children,
}: FormFieldProps) {
  const controlId = useId();
  const helpId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const isInvalid = error !== null && error !== "";
  const describedBy = [help ? helpId : null, isInvalid ? errorId : null]
    .filter((id) => id !== null)
    .join(" ");

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <Label htmlFor={controlId} className={cn(isLabelHidden && "sr-only")}>
        {label}
      </Label>
      <Slot.Root
        id={controlId}
        aria-describedby={describedBy || undefined}
        aria-invalid={isInvalid || undefined}
      >
        {children}
      </Slot.Root>
      {help && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {help}
        </p>
      )}
      {isInvalid && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

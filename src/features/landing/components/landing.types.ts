import type { LucideIcon } from "lucide-react";

/** One benefit card: message keys in the `landing` namespace and its icon. */
export interface Benefit {
  titleKey:
    "benefitBuddiesTitle" | "benefitLastAttemptTitle" | "benefitProgressTitle";
  descriptionKey:
    | "benefitBuddiesDescription"
    | "benefitLastAttemptDescription"
    | "benefitProgressDescription";
  Icon: LucideIcon;
}

import { ChartLine, History, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import type { Benefit } from "./landing.types";

/**
 * The landing page's three benefits (E04-T05): training with buddies, the
 * last attempt pre-filled and progress, each as a card with an icon, a
 * title and one sentence. One column on phones, three from 1024 px.
 */
export function BenefitList() {
  const translate = useTranslations("landing");

  return (
    <ul className="grid gap-3 lg:grid-cols-3">
      {BENEFITS.map(({ titleKey, descriptionKey, Icon }) => (
        <li key={titleKey}>
          <Card className="h-full flex-row items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
            </span>
            <div className="flex flex-col gap-1">
              <CardTitle as="h3" className="text-base">
                {translate(titleKey)}
              </CardTitle>
              <CardDescription>{translate(descriptionKey)}</CardDescription>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

const BENEFITS: readonly Benefit[] = [
  {
    titleKey: "benefitBuddiesTitle",
    descriptionKey: "benefitBuddiesDescription",
    Icon: Users,
  },
  {
    titleKey: "benefitLastAttemptTitle",
    descriptionKey: "benefitLastAttemptDescription",
    Icon: History,
  },
  {
    titleKey: "benefitProgressTitle",
    descriptionKey: "benefitProgressDescription",
    Icon: ChartLine,
  },
];

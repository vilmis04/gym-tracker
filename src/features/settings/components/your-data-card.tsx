import { Download, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Placeholder for data export and account deletion (E10-T05): the buttons
 * are shown, disabled, under a "Coming soon" note, so the page says honestly
 * that these don't exist yet.
 */
export function YourDataCard() {
  const translate = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{translate("dataTitle")}</CardTitle>
        <CardDescription>{translate("dataComingSoon")}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="secondary" disabled>
          <Download aria-hidden="true" size={20} strokeWidth={1.5} />
          {translate("exportData")}
        </Button>
        <Button variant="destructive" disabled>
          <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
          {translate("deleteAccount")}
        </Button>
      </CardFooter>
    </Card>
  );
}

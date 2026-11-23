import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ManageAccountButton } from "./manage-account-button";

import type { AccountCardProps } from "./settings.types";

/**
 * The settings page's Account section (E04-T04): photo, name and email as
 * plain text, not inputs. They come from Google through Clerk (synced to
 * `profiles`), so they can't be edited here; "Manage account" opens Clerk's
 * account management for the connected Google account and devices.
 */
export function AccountCard({ name, email, avatarUrl }: AccountCardProps) {
  const translate = useTranslations("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{translate("accountTitle")}</CardTitle>
        <CardDescription>{translate("managedByGoogle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-row items-center gap-4">
        <Avatar name={name} imageUrl={avatarUrl} size="lg" isDecorative />
        <dl className="flex min-w-0 flex-col gap-2">
          <div>
            <dt className="text-sm text-muted-foreground">
              {translate("name")}
            </dt>
            <dd className="font-semibold break-words">{name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {translate("email")}
            </dt>
            <dd className="break-all">{email}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <ManageAccountButton />
      </CardFooter>
    </Card>
  );
}

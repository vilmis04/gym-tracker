import { CalendarPlus, Plus } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { ThemeToggle } from "@/components/common/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  ChipDemo,
  DialogDemo,
  DropdownMenuDemo,
  LoadingButtonDemo,
  PopoverDemo,
  SegmentedControlDemo,
  SheetDemo,
  ToastDemo,
} from "./ui-demos";
import { SAMPLE_PEOPLE } from "./ui-samples";

/**
 * Base UI components preview (E02-T03): every component and variant, in the
 * theme picked with the toggle. Gated to development by
 * src/app/dev/layout.tsx; developer-only, so not translated.
 */
export default function UiPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-12 px-4 py-8 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">UI components</h1>
          <p className="text-muted-foreground">
            src/components/ui; see docs/design-system.md → Core components.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <DemoSection title="Button">
        {BUTTON_VARIANTS.map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            <Button variant={variant} size="sm">
              {variant} sm
            </Button>
            <Button variant={variant}>{variant} md</Button>
            <Button variant={variant} size="lg">
              <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
              {variant} lg
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <LoadingButtonDemo />
          <Button variant="secondary" isLoading>
            Loading
          </Button>
          <Button size="icon" aria-label="New session">
            <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Add">
            <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dev/tokens">Link as button</Link>
          </Button>
        </div>
        <Button size="lg" className="w-full sm:w-80">
          Start now
        </Button>
      </DemoSection>

      <DemoSection title="Input, Textarea, Label, FormField">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField label="Name" help="Shown to your gym buddies.">
            <Input placeholder="e.g. Leg day" />
          </FormField>
          <FormField label="Exercise" error="Enter a name for the exercise.">
            <Input defaultValue="" placeholder="e.g. Squat" />
          </FormField>
          <FormField label="Notes">
            <Textarea placeholder="How did it feel?" />
          </FormField>
          <FormField label="Disabled">
            <Input disabled defaultValue="Can’t change this" />
          </FormField>
        </div>
      </DemoSection>

      <DemoSection title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card variant="soft">
            <CardHeader>
              <Badge variant="primary" className="w-fit">
                Active · 42 min
              </Badge>
              <CardTitle>Tuesday session</CardTitle>
              <CardDescription>with Jonas and Ona</CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarStack
                people={SAMPLE_PEOPLE.slice(0, 3)}
                label="Participants"
                className="[--avatar-ring:var(--color-primary-soft)]"
              />
            </CardContent>
            <CardFooter>
              <Button size="lg" className="w-full">
                Continue
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar name="Tomas" isDecorative />
                <CardTitle as="h4" className="text-base font-normal">
                  Tomas wants to be your gym buddy
                </CardTitle>
              </div>
            </CardHeader>
            <CardFooter className="grid grid-cols-2">
              <Button variant="secondary" size="sm">
                Decline
              </Button>
              <Button size="sm">Accept</Button>
            </CardFooter>
          </Card>
        </div>
      </DemoSection>

      <DemoSection title="Dialog, Sheet, Popover, DropdownMenu">
        <div className="flex flex-wrap items-center gap-3">
          <DialogDemo />
          <SheetDemo />
          <PopoverDemo />
          <DropdownMenuDemo />
        </div>
      </DemoSection>

      <DemoSection title="Tabs">
        <Tabs defaultValue="upcoming">
          <TabsList aria-label="Session lists">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="invitations">Invitations · 2</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">Leg day · Thu 07:30</TabsContent>
          <TabsContent value="past">Tuesday session · 4 exercises</TabsContent>
          <TabsContent value="invitations">
            Rūta invited you to Friday push.
          </TabsContent>
        </Tabs>
      </DemoSection>

      <DemoSection title="SegmentedControl">
        <SegmentedControlDemo />
      </DemoSection>

      <DemoSection title="Toast">
        <ToastDemo />
      </DemoSection>

      <DemoSection title="Avatar, AvatarStack">
        <div className="flex flex-wrap items-center gap-4">
          {SAMPLE_PEOPLE.map((person) => (
            <Avatar key={person.id} name={person.name} />
          ))}
          <Avatar name="Lukas" size="lg" />
          <Avatar name="Lukas" size="sm" />
          <AvatarStack people={SAMPLE_PEOPLE} label="Participants" />
          <AvatarStack
            people={SAMPLE_PEOPLE}
            label="Participants"
            size="md"
            maxVisible={2}
          />
        </div>
      </DemoSection>

      <DemoSection title="Chip, Badge">
        <ChipDemo />
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Planned</Badge>
          <Badge variant="primary">Active</Badge>
          <Badge variant="success">Saved</Badge>
          <Badge variant="warning">PR</Badge>
          <Badge variant="destructive">Declined</Badge>
        </div>
      </DemoSection>

      <DemoSection title="Skeleton">
        <div aria-busy="true" className="flex items-center gap-4">
          <span className="sr-only">Loading</span>
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-28 rounded-2xl" />
      </DemoSection>

      <DemoSection title="EmptyState">
        <EmptyState
          icon={<CalendarPlus aria-hidden="true" size={20} strokeWidth={1.5} />}
          message="No sessions planned yet. Plan one and invite your buddies."
          action={<Button>Plan a session</Button>}
        />
      </DemoSection>
    </main>
  );
}

const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "ghost",
  "destructive",
] as const;

function DemoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

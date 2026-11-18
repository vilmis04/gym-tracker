"use client";

import {
  Copy,
  Ellipsis,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";

import { SAMPLE_PEOPLE, SAMPLE_TAGS } from "./ui-samples";

// Interactive demos for /dev/ui (developer-only, so not translated).

const SIMULATED_SAVE_MS = 2000;

export function LoadingButtonDemo() {
  const [isSaving, setIsSaving] = useState(false);

  const startSaving = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), SIMULATED_SAVE_MS);
  };

  return (
    <Button isLoading={isSaving} onClick={startSaving}>
      {isSaving ? "Saving…" : "Save (2 s)"}
    </Button>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
          Delete session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this session?</DialogTitle>
          <DialogDescription>
            Its exercises and sets are removed for everyone. This can’t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="destructive"
              onClick={() => showToast("Session deleted")}
            >
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
          Add exercise
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add exercise</SheetTitle>
          <SheetDescription>
            Search your exercises or create a new one.
          </SheetDescription>
        </SheetHeader>
        <FormField label="Search exercises" isLabelHidden>
          <Input type="search" placeholder="Search exercises" />
        </FormField>
        <ul className="flex flex-col">
          {["Squat", "Front squat", "Bulgarian split squat"].map((name) => (
            <li
              key={name}
              className="flex min-h-16 items-center border-b border-border text-base"
            >
              {name}
            </li>
          ))}
        </ul>
        <SheetFooter>
          <Button size="lg" className="w-full">
            Create “squ”
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <Search aria-hidden="true" size={20} strokeWidth={1.5} />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-3">
        <p className="text-sm font-medium">Filter sessions</p>
        <FormField label="Exercise" help="Only sessions with this exercise.">
          <Input placeholder="e.g. Squat" />
        </FormField>
      </PopoverContent>
    </Popover>
  );
}

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Session actions">
          <Ellipsis aria-hidden="true" size={20} strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Session</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => showToast("Rename")}>
          <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => showToast("Duplicated")}>
          <Copy aria-hidden="true" size={20} strokeWidth={1.5} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings aria-hidden="true" size={20} strokeWidth={1.5} />
          Settings (disabled)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => showToast("Left the session")}
        >
          <LogOut aria-hidden="true" size={20} strokeWidth={1.5} />
          Leave session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PARTICIPANT_OPTIONS = SAMPLE_PEOPLE.slice(0, 3).map((person) => ({
  value: person.id,
  label: person.name.split(" ")[0] ?? person.name,
  icon: <Avatar name={person.name} size="sm" isDecorative />,
}));

export function SegmentedControlDemo() {
  const [participantId, setParticipantId] = useState<string>("lukas");

  return (
    <SegmentedControl
      legend="Logging for"
      options={PARTICIPANT_OPTIONS}
      value={participantId}
      onValueChange={setParticipantId}
    />
  );
}

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => showToast("Set saved")}>
        Show toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          showToast("Set deleted", {
            description: "30 kg × 10",
            action: { label: "Undo", onClick: () => showToast("Set restored") },
          })
        }
      >
        Toast with action
      </Button>
    </div>
  );
}

export function ChipDemo() {
  const [tags, setTags] = useState<readonly string[]>(SAMPLE_TAGS);

  const removeTag = (tagToRemove: string) =>
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Chip key={tag} label={tag} onRemove={() => removeTag(tag)} />
      ))}
      <Chip label="Static chip" />
      <Chip
        label="Ona"
        icon={<Avatar name="Ona" size="sm" isDecorative />}
        onRemove={() => showToast("Ona removed")}
      />
      {tags.length < SAMPLE_TAGS.length && (
        <Button variant="ghost" size="sm" onClick={() => setTags(SAMPLE_TAGS)}>
          Reset tags
        </Button>
      )}
    </div>
  );
}

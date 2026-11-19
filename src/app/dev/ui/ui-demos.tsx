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
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Combobox } from "@/components/ui/combobox/combobox";
import type { ComboboxSearchOptions } from "@/components/ui/combobox/combobox.types";
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
import { normalizeSearchText } from "@/lib/utils/normalize-search-text";

import {
  SAMPLE_EXERCISES,
  SAMPLE_MACHINES,
  SAMPLE_PEOPLE,
  SAMPLE_TAG_OPTIONS,
  SAMPLE_TAGS,
} from "./ui-samples";

import type { SampleExercise } from "./ui-samples.types";

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

// A slow fake server: answers after 600 ms, so the spinner, the debounce and
// the cancellation of older requests can be seen.
const SIMULATED_SEARCH_MS = 600;

const searchSamples =
  <T,>(getItems: () => readonly T[], getLabel: (item: T) => string) =>
  (query: string, { signal }: ComboboxSearchOptions) =>
    new Promise<readonly T[]>((resolve, reject) => {
      const normalizedQuery = normalizeSearchText(query);
      const timeoutId = setTimeout(() => {
        resolve(
          getItems().filter((item) =>
            normalizeSearchText(getLabel(item)).includes(normalizedQuery),
          ),
        );
      }, SIMULATED_SEARCH_MS);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(signal.reason);
      });
    });

const getSampleExerciseKey = (exercise: SampleExercise) => exercise.id;
const getSampleExerciseName = (exercise: SampleExercise) => exercise.name;
const searchSampleExercises = searchSamples(
  () => SAMPLE_EXERCISES,
  getSampleExerciseName,
);
const RECENT_SAMPLE_EXERCISES = SAMPLE_EXERCISES.slice(0, 3);

const getText = (text: string) => text;
const searchSampleMachines = searchSamples(() => SAMPLE_MACHINES, getText);

export function ComboboxDemo() {
  const [exercise, setExercise] = useState<SampleExercise | null>(null);
  const [machine, setMachine] = useState<string | null>(null);
  const [tags, setTags] = useState<readonly string[]>(["chest"]);
  const [tagOptions, setTagOptions] =
    useState<readonly string[]>(SAMPLE_TAG_OPTIONS);
  const searchTags = useMemo(
    () => searchSamples(() => tagOptions, getText),
    [tagOptions],
  );

  const createExercise = (name: string) => {
    setExercise({ id: `new-${name}`, name, machine: null });
    showToast(`Would open “New exercise” with “${name}”`);
  };

  const createTag = (tag: string) => {
    setTagOptions((currentOptions) => [...currentOptions, tag]);
    setTags((currentTags) => [...currentTags, tag]);
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField
        label="Exercise"
        help="Single, with “Create”. Try “spaudimas”, “squ” or “pritu”."
      >
        <Combobox
          label="Exercise"
          placeholder="Choose an exercise"
          searchPlaceholder="Search exercises"
          onSearch={searchSampleExercises}
          getKey={getSampleExerciseKey}
          getLabel={getSampleExerciseName}
          renderItem={(item, { highlightedLabel }) => (
            <>
              {highlightedLabel}
              {item.machine && (
                <span className="text-sm text-muted-foreground">
                  {item.machine}
                </span>
              )}
            </>
          )}
          initialItems={RECENT_SAMPLE_EXERCISES}
          value={exercise}
          onChange={setExercise}
          allowCreate
          onCreate={createExercise}
        />
      </FormField>
      <FormField label="Machine" help="Single, without “Create”.">
        <Combobox
          label="Machine"
          placeholder="No machine"
          searchPlaceholder="Search machines"
          emptyText="No machine with that name."
          onSearch={searchSampleMachines}
          getKey={getText}
          getLabel={getText}
          value={machine}
          onChange={setMachine}
        />
      </FormField>
      <FormField
        label="Tags"
        help="Multiple, with “Create”."
        className="sm:col-span-2"
      >
        <Combobox
          label="Tags"
          placeholder="Add tag"
          searchPlaceholder="Search tags"
          onSearch={searchTags}
          getKey={getText}
          getLabel={getText}
          initialItems={tagOptions}
          multiple
          value={tags}
          onChange={setTags}
          allowCreate
          onCreate={createTag}
        />
      </FormField>
    </div>
  );
}

import type { ColorGroup, ScaleStep } from "./token-catalog.types";

// Full class names stay literal so Tailwind finds them when scanning sources.
export const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Surfaces and text",
    swatches: [
      {
        token: "background",
        className: "bg-background text-foreground",
        usage: "Page background, body text",
      },
      {
        token: "surface",
        className: "bg-surface text-foreground",
        usage: "Cards, inputs, steppers",
      },
      {
        token: "card",
        className: "bg-card text-card-foreground",
        usage: "Alias of surface (shadcn/ui)",
      },
      {
        token: "popover",
        className: "bg-popover text-popover-foreground",
        usage: "Menus, sheets, dialogs",
      },
      {
        token: "muted",
        className: "bg-muted text-muted-foreground",
        usage: "Skeletons; muted text on it",
      },
      {
        token: "foreground",
        className: "bg-foreground text-background",
        usage: "Body text, toasts",
      },
      {
        token: "muted-foreground",
        className: "bg-muted-foreground text-background",
        usage: "Secondary text, icons",
      },
    ],
  },
  {
    title: "Brand and status",
    swatches: [
      {
        token: "primary",
        className: "bg-primary text-primary-foreground",
        usage: "Main action, active nav item",
      },
      {
        token: "primary-soft",
        className: "bg-primary-soft text-primary",
        usage: "Active session card, selected chips",
      },
      {
        token: "secondary",
        className: "bg-secondary text-secondary-foreground",
        usage: "Secondary buttons",
      },
      {
        token: "accent",
        className: "bg-accent text-accent-foreground",
        usage: "Hover and highlighted items",
      },
      {
        token: "success",
        className: "bg-success text-success-foreground",
        usage: "Saved, done",
      },
      {
        token: "warning",
        className: "bg-warning text-warning-foreground",
        usage: "Warnings, PR badge",
      },
      {
        token: "destructive",
        className: "bg-destructive text-destructive-foreground",
        usage: "Delete, errors",
      },
    ],
  },
  {
    title: "Lines and focus",
    swatches: [
      {
        token: "border",
        className: "bg-border text-foreground",
        usage: "Dividers (decorative)",
      },
      {
        token: "input",
        className: "bg-input text-background",
        usage: "Control borders (3:1)",
      },
      {
        token: "ring",
        className: "bg-ring text-background",
        usage: "Focus ring",
      },
      {
        token: "scrim",
        className: "bg-scrim text-foreground",
        usage: "Overlay behind dialogs and sheets",
      },
    ],
  },
  {
    title: "Charts",
    swatches: [
      {
        token: "chart-1",
        className: "bg-chart-1 text-background",
        usage: "Series 1 (sage)",
      },
      {
        token: "chart-2",
        className: "bg-chart-2 text-background",
        usage: "Series 2 (dusty blue)",
      },
      {
        token: "chart-3",
        className: "bg-chart-3 text-background",
        usage: "Series 3 (mauve)",
      },
      {
        token: "chart-4",
        className: "bg-chart-4 text-background",
        usage: "Series 4 (ochre)",
      },
      {
        token: "chart-5",
        className: "bg-chart-5 text-background",
        usage: "Series 5 (clay)",
      },
    ],
  },
];

export const TYPE_SCALE: ScaleStep[] = [
  { className: "text-xs", pixels: 12, usage: "Nav labels, captions" },
  { className: "text-sm", pixels: 14, usage: "Meta text, labels" },
  { className: "text-base", pixels: 16, usage: "Body" },
  { className: "text-lg", pixels: 18, usage: "Card titles" },
  { className: "text-xl", pixels: 20, usage: "Section titles" },
  { className: "text-2xl", pixels: 24, usage: "Page titles" },
  { className: "text-3xl", pixels: 30, usage: "Desktop page titles" },
  { className: "text-4xl", pixels: 36, usage: "Hero numbers" },
];

export const RADIUS_SCALE: ScaleStep[] = [
  { className: "rounded-sm", pixels: 10, usage: "Small controls" },
  { className: "rounded-md", pixels: 12, usage: "Compact buttons" },
  { className: "rounded-lg", pixels: 14, usage: "Buttons, inputs" },
  { className: "rounded-xl", pixels: 18, usage: "Small cards" },
  { className: "rounded-2xl", pixels: 20, usage: "Cards" },
  { className: "rounded-3xl", pixels: 24, usage: "Sheets" },
];

export const SPACING_SCALE: ScaleStep[] = [
  { className: "w-1", pixels: 4, usage: "1 unit" },
  { className: "w-2", pixels: 8, usage: "Icon gaps" },
  { className: "w-3", pixels: 12, usage: "Item gaps" },
  { className: "w-4", pixels: 16, usage: "Mobile page gutter" },
  { className: "w-5", pixels: 20, usage: "Card padding" },
  { className: "w-6", pixels: 24, usage: "Desktop page gutter" },
  { className: "w-8", pixels: 32, usage: "Section gaps" },
  { className: "w-11", pixels: 44, usage: "Minimum touch target" },
];

export const LITHUANIAN_SAMPLE = "ąčęėįšųūž ĄČĘĖĮŠŲŪŽ";

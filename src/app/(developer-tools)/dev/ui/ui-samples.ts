// Sample data for the /dev/ui preview (developer-only, not translated).
export const SAMPLE_PEOPLE = [
  { id: "lukas", name: "Lukas" },
  { id: "jonas", name: "Jonas Petraitis" },
  { id: "ona", name: "Ona" },
  { id: "ruta", name: "Rūta Žemaitė" },
  { id: "tomas", name: "Tomas" },
] as const;

export const SAMPLE_TAGS = ["legs", "quads", "glutes"] as const;

// Accent-y Lithuanian names for the Combobox demos (accent-insensitive search).
export const SAMPLE_EXERCISES = [
  { id: "spaudimas", name: "Špaudimas", machine: "Barbell" },
  { id: "spaudimas-gulint", name: "spaudimas gulint", machine: "Bench" },
  { id: "pritupimai", name: "Pritūpimai", machine: "Barbell" },
  { id: "squat", name: "Squat", machine: "Barbell" },
  { id: "hack-squat", name: "Hack squat", machine: "Hack squat machine" },
  { id: "goblet-squat", name: "Goblet squat", machine: "Dumbbells" },
  { id: "bench-press", name: "Bench press", machine: "Bench" },
  { id: "itupstai", name: "Įtūpstai", machine: "Dumbbells" },
  { id: "prisitraukimai", name: "Prisitraukimai", machine: "Pull-up bar" },
  { id: "trauka", name: "Štangos trauka", machine: "Barbell" },
  { id: "koju-spaudimas", name: "Kojų spaudimas", machine: "Leg press" },
  { id: "lat-pulldown", name: "Lat pulldown", machine: "Cable" },
] as const;

export const SAMPLE_MACHINES = [
  "Barbell",
  "Bench",
  "Cable",
  "Dumbbells",
  "Hack squat machine",
  "Leg press",
  "Pull-up bar",
  "Smith machine",
] as const;

export const SAMPLE_TAG_OPTIONS = [
  ...SAMPLE_TAGS,
  "chest",
  "back",
  "shoulders",
  "core",
  "šlaunys",
  "nugara",
] as const;

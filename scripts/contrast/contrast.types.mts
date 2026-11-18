export type RgbColor = {
  red: number;
  green: number;
  blue: number;
  /** 0–1; tokens checked for contrast must be opaque. */
  alpha: number;
};

/** Custom property name (without `--`) → raw CSS value. */
export type TokenValues = Map<string, string>;

export type ThemeName = "light" | "dark";

export type ThemeTokens = Record<ThemeName, TokenValues>;

export type ContrastPair = {
  foreground: string;
  background: string;
  minimumRatio: number;
  purpose: string;
};

export type ContrastResult = ContrastPair & {
  theme: ThemeName;
  /** `null` when a token is missing or not a checkable color; see `error`. */
  ratio: number | null;
  isPassing: boolean;
  error?: string;
};

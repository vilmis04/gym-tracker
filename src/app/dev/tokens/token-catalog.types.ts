export type ColorSwatch = {
  /** CSS variable name without the leading `--`, as in src/app/globals.css. */
  token: string;
  /** Utility classes that paint the swatch (background plus paired text color). */
  className: string;
  usage: string;
};

export type ColorGroup = {
  title: string;
  swatches: ColorSwatch[];
};

export type ScaleStep = {
  className: string;
  pixels: number;
  usage: string;
};

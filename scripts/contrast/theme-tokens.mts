import type { ThemeName, ThemeTokens, TokenValues } from "./contrast.types.mts";

/** CSS comments, e.g. "/* Design tokens *\/". */
const CSS_COMMENT_REGEX = /\/\*[\s\S]*?\*\//g;

/**
 * Innermost CSS rules: selector (after the previous rule or statement) and a
 * body without nested braces, e.g. ":root { --background: hsl(…); }" or
 * ":root,\n.dark { --card: var(--surface); }".
 */
const CSS_RULE_REGEX = /([^{};]+)\{([^{}]*)\}/g;

/** Custom property declarations, e.g. "--muted-foreground: hsl(30 9.8% 32.2%);". */
const CUSTOM_PROPERTY_REGEX = /--([\w-]+)\s*:\s*([^;]+);/g;

/** A value that only points at another token, e.g. "var(--surface)". */
const VAR_REFERENCE_REGEX = /^var\(\s*--([\w-]+)\s*\)$/;

const THEME_SELECTORS: Record<ThemeName, string> = {
  light: ":root",
  dark: ".dark",
};

/**
 * Reads the token values of both themes from the stylesheet: `:root` rules
 * are the light theme; the dark theme is what an element with the `dark`
 * class computes, i.e. its own `.dark` declarations over the values it
 * inherits from `:root`. `var(--token)` references are resolved per theme.
 *
 * @throws {Error} When a reference points at an unknown token or loops.
 */
export function readThemeTokens(stylesheet: string): ThemeTokens {
  const rules = parseCustomPropertyRules(stylesheet);
  const light = resolveReferences(collectDeclarations(rules, "light"));
  const dark = resolveReferences(
    new Map([...light, ...collectDeclarations(rules, "dark")]),
  );
  return { light, dark };
}

function parseCustomPropertyRules(
  stylesheet: string,
): { selectors: string[]; declarations: TokenValues }[] {
  const withoutComments = stylesheet.replace(CSS_COMMENT_REGEX, "");
  return [...withoutComments.matchAll(CSS_RULE_REGEX)].map(
    ([, selectorText = "", body = ""]) => ({
      selectors: selectorText.split(",").map((selector) => selector.trim()),
      declarations: new Map(
        [...body.matchAll(CUSTOM_PROPERTY_REGEX)].map(
          ([, name = "", value = ""]) => [name, value.trim()] as const,
        ),
      ),
    }),
  );
}

function collectDeclarations(
  rules: { selectors: string[]; declarations: TokenValues }[],
  theme: ThemeName,
): TokenValues {
  const themeSelector = THEME_SELECTORS[theme];
  return new Map(
    rules
      .filter(({ selectors }) => selectors.includes(themeSelector))
      .flatMap(({ declarations }) => [...declarations]),
  );
}

function resolveReferences(tokens: TokenValues): TokenValues {
  const resolveToken = (name: string, visited: string[]): string => {
    const value = tokens.get(name);
    if (value === undefined) {
      throw new Error(
        `Token --${visited.at(-2)} references --${name}, which is not defined.`,
      );
    }
    const reference = VAR_REFERENCE_REGEX.exec(value)?.[1];
    if (reference === undefined) return value;
    if (visited.includes(reference)) {
      throw new Error(
        `Token references loop: ${[...visited, reference].map((token) => `--${token}`).join(" → ")}.`,
      );
    }
    return resolveToken(reference, [...visited, reference]);
  };

  return new Map(
    [...tokens.keys()].map((name) => [name, resolveToken(name, [name])]),
  );
}

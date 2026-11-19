// @vitest-environment node
/**
 * Runs scripts/check-raw-colors.sh (E02-T01) against throwaway source trees,
 * and against the real src/ (which must stay clean). Needs bash and grep.
 */
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const script = fileURLToPath(
  new URL("../../../scripts/check-raw-colors.sh", import.meta.url),
);
const repositorySource = fileURLToPath(
  new URL("../../../src", import.meta.url),
);

let sourceRoot: string;

const writeSource = async (relativePath: string, content: string) => {
  const path = join(sourceRoot, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
};

const runCheck = async (root: string) => {
  try {
    const { stdout, stderr } = await execFileAsync("bash", [script, root], {
      env: { ...process.env, GITHUB_ACTIONS: "" },
    });
    return { exitCode: 0, output: stdout + stderr };
  } catch (error) {
    const { code, stdout, stderr } = error as {
      code: number;
      stdout: string;
      stderr: string;
    };
    return { exitCode: code, output: stdout + stderr };
  }
};

beforeEach(async () => {
  sourceRoot = await mkdtemp(join(tmpdir(), "raw-colors-"));
  await writeSource(
    "app/globals.css",
    ":root { --primary: hsl(96.8 15.9% 38.2%); --ink: #2e2a25; }\n",
  );
});

afterEach(async () => {
  await rm(sourceRoot, { recursive: true, force: true });
});

describe("check-raw-colors.sh", () => {
  it("passes when colors appear only in the token file", async () => {
    await writeSource(
      "components/card.tsx",
      [
        'export const Card = () => <a href="#main" className="bg-primary text-[var(--primary)]">&#123;</a>;',
        "const mixed = 'color-mix(in oklab, var(--primary) 50%, transparent)';",
      ].join("\n"),
    );

    const { exitCode, output } = await runCheck(sourceRoot);

    expect(output).toContain("No raw colors");
    expect(exitCode).toBe(0);
  });

  it.each([
    ["components/alert.module.css", ".alert { color: #ff0000; }"],
    ["components/alert.tsx", 'const style = { color: "#ff0000" };'],
    ["components/badge.tsx", 'const className = "bg-[#FAF7F2]";'],
    ["components/badge.tsx", 'const className = "bg-[#fff8]";'],
    ["components/chart.ts", 'const stroke = "rgb(255 0 0)";'],
    ["components/chart.ts", 'const fill = "rgba(0,0,0,.5)";'],
    ["components/chart.ts", 'const fill = "hsl(0 0% 0%)";'],
    ["styles/extra.css", ".x { background: oklch(0.7 0.1 120); }"],
  ])("fails on a raw color in %s: %s", async (relativePath, content) => {
    await writeSource(relativePath, content);

    const { exitCode, output } = await runCheck(sourceRoot);

    expect(exitCode).toBe(1);
    expect(output).toContain(`${relativePath}:1:`);
    expect(output).toContain("raw colors found");
  });

  it("skips lines marked raw-color-allowed", async () => {
    await writeSource(
      "components/logo.tsx",
      'const brand = "#4285f4"; // raw-color-allowed: Google brand color\n',
    );

    expect((await runCheck(sourceRoot)).exitCode).toBe(0);
  });

  it("annotates failures for GitHub Actions", async () => {
    await writeSource("components/alert.tsx", 'const color = "#ff0000";');

    const { stdout } = await execFileAsync("bash", [script, sourceRoot], {
      env: { ...process.env, GITHUB_ACTIONS: "true" },
    }).catch((error: { stdout: string }) => error);

    expect(stdout).toContain(
      `::error file=${sourceRoot}/components/alert.tsx,line=1::`,
    );
  });

  it("finds no raw colors in the repository's src/", async () => {
    const { exitCode, output } = await runCheck(repositorySource);

    expect(output).toContain("No raw colors");
    expect(exitCode).toBe(0);
  });
});

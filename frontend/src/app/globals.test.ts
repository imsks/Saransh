import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "globals.css"), "utf8");

/** Body of the first rule whose selector is exactly `selector`. */
function block(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No ${selector} block in globals.css`);
  return match[1];
}

/** Custom properties declared in a block, as name → value. */
function tokens(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    found.set(name, value.trim());
  }
  return found;
}

const light = tokens(block(":root"));
const dark = tokens(block(".dark"));

describe("globals.css tokens", () => {
  it("aliases --background and --foreground to --paper and --ink", () => {
    expect(light.get("--background")).toBe("var(--paper)");
    expect(light.get("--foreground")).toBe("var(--ink)");
  });

  it("does not redeclare the aliases in dark mode", () => {
    expect(dark.has("--background")).toBe(false);
    expect(dark.has("--foreground")).toBe(false);
  });

  it("uses the warm dark paper, not the retired cold value", () => {
    expect(dark.get("--paper")).toBe("#191816");
    expect(css).not.toContain("#111417");
  });

  it("defines every palette token in both themes", () => {
    const palette = [...light.keys()].filter(
      (name) => !name.startsWith("--sutra-") && !["--background", "--foreground"].includes(name),
    );
    const missing = palette.filter((name) => !dark.has(name) && !name.endsWith("-bg"));
    expect(missing).toEqual([]);
    expect([...dark.keys()].filter((name) => !light.has(name))).toEqual([]);
  });

  it("keeps the heading font rule in the base layer so font utilities can override it", () => {
    const unlayered = css.replace(/@layer base\s*\{[\s\S]*?\n\}/g, "");
    expect(unlayered).not.toMatch(/\bh1\s*,/);
  });
});

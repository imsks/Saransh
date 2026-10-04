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
    expect(palette.filter((name) => !dark.has(name))).toEqual([]);
    expect([...dark.keys()].filter((name) => !light.has(name))).toEqual([]);
  });

  it("carries the v1.2 app tokens with the design-system values", () => {
    expect(light.get("--body")).toBe("#2d3139");
    expect(dark.get("--body")).toBe("#c9c6bf");
    expect(light.get("--on-red")).toBe("#ffffff");
    expect(dark.get("--on-red")).toBe("#191816");
    expect(dark.get("--card-shadow")).toBe("none");
    expect(light.get("--topic-transport")).toBe("#b35f00");
    expect(dark.get("--topic-transport")).toBe("#edbf63");
  });

  it("exposes every palette token to Tailwind", () => {
    const theme = tokens(css.slice(css.indexOf("@theme inline")));
    const unmapped = [...light.keys()].filter((name) => {
      if (name.startsWith("--sutra-")) return false;
      if (name === "--card-shadow" || name === "--print-shadow") return false;
      return theme.get(`--color-${name.slice(2)}`) !== `var(${name})`;
    });
    expect(unmapped).toEqual([]);
    expect(theme.get("--shadow-app-card")).toBe("var(--card-shadow)");
    expect(theme.get("--shadow-print")).toBe("var(--print-shadow)");
  });

  it("keeps the heading font rule in the base layer so font utilities can override it", () => {
    const unlayered = css.replace(/@layer base\s*\{[\s\S]*?\n\}/g, "");
    expect(unlayered).not.toMatch(/\bh1\s*,/);
  });
});

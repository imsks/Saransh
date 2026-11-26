import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "@jest/globals";

const SRC = join(__dirname, "../../src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("reduced motion", () => {
  it("scales on press only when motion is allowed", () => {
    const unguarded = /(?<!motion-safe:)active:scale-/;
    const offenders = sourceFiles(SRC).filter((path) => unguarded.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("app icons", () => {
  it("draws the mark in the fixed light-theme ink, paper and red", () => {
    const svg = readFileSync(join(SRC, "app/icon.svg"), "utf8");
    expect(svg).toContain('fill="#0f1419"');
    expect(svg).toContain('stroke="#eeedea"');
    expect(svg).toContain('fill="#c41e2e"');
    expect(svg).not.toContain("var(");
  });

  it("ships a 180px apple icon and a 16, 32 and 48px favicon", () => {
    const png = readFileSync(join(SRC, "app/apple-icon.png"));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);

    const ico = readFileSync(join(SRC, "app/favicon.ico"));
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16]);
    expect(sizes).toEqual([16, 32, 48]);
  });
});

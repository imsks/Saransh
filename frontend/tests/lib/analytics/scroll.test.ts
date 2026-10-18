/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";

import type { ScrollDepth } from "@/lib/analytics/events";
import { newMilestones, scrollFraction } from "@/lib/analytics/scroll";

describe("scrollFraction", () => {
  it("measures the bottom of the viewport against the page", () => {
    expect(scrollFraction(0, 800, 3200)).toBe(0.25);
    expect(scrollFraction(2400, 800, 3200)).toBe(1);
  });

  it("counts a page shorter than the viewport as fully seen", () => {
    expect(scrollFraction(0, 900, 600)).toBe(1);
  });
});

describe("newMilestones", () => {
  it("reports every milestone passed, lowest first", () => {
    expect(newMilestones(0.6, new Set())).toEqual([25, 50]);
  });

  it("never reports a milestone twice", () => {
    expect(newMilestones(0.8, new Set<ScrollDepth>([25, 50]))).toEqual([75]);
  });

  it("reports nothing above the fold", () => {
    expect(newMilestones(0.2, new Set())).toEqual([]);
  });

  it("forgives the last pixel for 100", () => {
    expect(newMilestones(0.995, new Set<ScrollDepth>([25, 50, 75]))).toEqual([100]);
  });
});

import { describe, expect, it } from "@jest/globals";

import { buttonClass, cardClass, cx, eyebrowClass } from "@/components/ui";

describe("cx", () => {
  it("joins only truthy class names", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });
});

describe("cardClass", () => {
  it("gives every card the same curve", () => {
    for (const variant of ["elevated", "outlined", "info"] as const) {
      expect(cardClass({ variant })).toContain("rounded-3xl");
    }
  });

  it("defaults to an outlined card with medium padding", () => {
    const classes = cardClass();
    expect(classes).toContain("border-edge");
    expect(classes).not.toContain("shadow-app-card");
    expect(classes).toContain("p-6");
  });

  it("lifts the elevated card and tints the info card", () => {
    expect(cardClass({ variant: "elevated" })).toContain("shadow-app-card");
    expect(cardClass({ variant: "info" })).toContain("bg-blue-tint");
  });

  it("drops padding entirely for padding none", () => {
    expect(cardClass({ padding: "none" })).not.toMatch(/\bp-\d/);
    expect(cardClass({ padding: "lg" })).toContain("p-8");
  });
});

describe("buttonClass", () => {
  it("rounds buttons to match the cards", () => {
    expect(buttonClass()).toContain("rounded-xl");
    expect(buttonClass({ variant: "secondary" })).toContain("rounded-xl");
  });

  it("fills the primary button and outlines the secondary", () => {
    expect(buttonClass()).toContain("bg-ink");
    expect(buttonClass({ variant: "secondary" })).toContain("border-ink");
    expect(buttonClass({ variant: "secondary" })).not.toContain("bg-ink");
  });

  it("stretches only when asked", () => {
    expect(buttonClass()).not.toContain("w-full");
    expect(buttonClass({ fullWidth: true })).toContain("w-full");
  });
});

describe("eyebrowClass", () => {
  it("is muted by default and takes a tone", () => {
    expect(eyebrowClass()).toContain("text-muted");
    expect(eyebrowClass("accent")).toContain("text-red");
    expect(eyebrowClass("info")).toContain("text-blue");
  });
});

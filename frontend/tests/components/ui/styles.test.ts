import { describe, expect, it } from "@jest/globals";

import { buttonClass, cardClass, circleButtonClass, cx, eyebrowClass } from "@/components/ui";

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
  const primary = buttonClass().split(" ");
  const action = buttonClass({ variant: "action" }).split(" ");
  const secondary = buttonClass({ variant: "secondary" }).split(" ");
  const small = buttonClass({ size: "small" }).split(" ");

  it("sets every label in Inter 15px / 600, sentence case, with a 12px radius and no shadow", () => {
    for (const classes of [primary, action, secondary, small]) {
      expect(classes).toEqual(
        expect.arrayContaining(["rounded-xl", "font-sans", "text-[15px]", "font-semibold"]),
      );
      expect(classes.join(" ")).not.toMatch(/uppercase|shadow|tracking-/);
    }
  });

  it("is 52px tall by default and 44px small; only height and padding change", () => {
    expect(primary).toContain("min-h-[52px]");
    expect(small).toContain("min-h-11");
    expect(small).not.toContain("min-h-[52px]");
  });

  it("fills the primary with ink and fades it on hover and press, never red", () => {
    expect(primary).toEqual(
      expect.arrayContaining([
        "bg-ink",
        "text-paper",
        "enabled:hover:opacity-[0.92]",
        "enabled:active:opacity-[0.85]",
        "disabled:bg-line-heavy",
        "disabled:text-muted",
      ]),
    );
    expect(primary.join(" ")).not.toMatch(/(bg|text|border)-red|on-red/);
  });

  it("turns only the action button red on hover and press", () => {
    expect(action).toEqual(
      expect.arrayContaining([
        "bg-ink",
        "hover:bg-red",
        "hover:text-on-red",
        "active:bg-red",
        "active:text-on-red",
        "disabled:bg-line-heavy",
      ]),
    );
  });

  it("gives the secondary a card fill and an ink border in both themes, tinting on hover and press", () => {
    expect(secondary).toEqual(
      expect.arrayContaining([
        "bg-card",
        "border-[1.5px]",
        "border-ink",
        "text-ink",
        "hover:bg-tint",
        "active:bg-tint",
        "disabled:border-line-heavy",
        "disabled:text-muted",
      ]),
    );
    expect(secondary.join(" ")).not.toMatch(/dark:|(bg|text|border)-red|on-red/);
  });

  it("presses every variant to 0.98 over 120ms, only when motion is allowed", () => {
    for (const classes of [primary, action, secondary]) {
      expect(classes).toEqual(
        expect.arrayContaining(["motion-safe:active:scale-[0.98]", "duration-[120ms]", "ease-out"]),
      );
    }
  });

  it("stretches only when asked", () => {
    expect(primary).not.toContain("w-full");
    expect(buttonClass({ fullWidth: true })).toContain("w-full");
  });
});

describe("circleButtonClass", () => {
  const back = circleButtonClass("back").split(" ");
  const next = circleButtonClass("next").split(" ");

  it("is 56px, 44px compact, fades on hover and press, presses to 0.96, and never turns red", () => {
    for (const classes of [back, next]) {
      expect(classes).toEqual(
        expect.arrayContaining([
          "rounded-full",
          "size-14",
          "compact:size-11",
          "enabled:hover:opacity-[0.92]",
          "enabled:active:opacity-[0.85]",
          "motion-safe:active:scale-[0.96]",
          "disabled:opacity-35",
        ]),
      );
      expect(classes.join(" ")).not.toMatch(/(bg|text|border)-red|on-red/);
    }
    expect(next).toContain("bg-ink");
    expect(back).toContain("border-ink");
  });
});

describe("eyebrowClass", () => {
  it("is muted by default and takes a tone", () => {
    expect(eyebrowClass()).toContain("text-muted");
    expect(eyebrowClass("accent")).toContain("text-red");
    expect(eyebrowClass("info")).toContain("text-blue");
  });
});

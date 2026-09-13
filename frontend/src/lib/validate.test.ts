import { describe, expect, it } from "vitest";

import { validateEmail, validateName } from "./validate";

describe("validateName", () => {
  it("rejects empty names and very short values", () => {
    expect(validateName("   ")).toEqual({
      valid: false,
      message: "Please enter your real name.",
    });
    expect(validateName("A")).toEqual({
      valid: false,
      message: "Please enter your real name.",
    });
  });

  it("rejects same-character repeats", () => {
    expect(validateName("BBBB")).toEqual({
      valid: false,
      message: "Please enter your real name.",
    });
  });

  it("rejects all-uppercase consonants without vowels", () => {
    expect(validateName("SDFLK")).toEqual({
      valid: false,
      message: "Please enter your real name.",
    });
  });

  it("rejects triple repeated characters", () => {
    expect(validateName("Praaatik")).toEqual({
      valid: false,
      message: "Please enter your real name.",
    });
  });

  it("rejects names with fewer than 2 distinct non-space characters", () => {
    expect(validateName("a a a")).toEqual({
      valid: false,
      message: "Please enter your real name.",
    });
  });

  it("accepts valid names", () => {
    expect(validateName("  Priya  ")).toEqual({ valid: true });
  });
});

describe("validateEmail", () => {
  it("rejects empty emails", () => {
    expect(validateEmail("")).toEqual({
      valid: false,
      message: "Please enter a valid email address.",
    });
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toEqual({
      valid: false,
      message: "Please enter a valid email address.",
    });
  });

  it("accepts valid emails", () => {
    expect(validateEmail("hello@example.com")).toEqual({ valid: true });
  });
});

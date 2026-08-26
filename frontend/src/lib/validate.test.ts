import { describe, expect, it } from "vitest";

import { validateEmail, validateLanguage, validateName } from "./validate";

describe("validateName", () => {
  it("rejects empty names", () => {
    expect(validateName("   ")).toEqual({ valid: false, message: "Name is required." });
  });

  it("rejects very short names", () => {
    expect(validateName("A")).toEqual({
      valid: false,
      message: "Name must be at least 2 characters.",
    });
  });

  it("accepts valid names", () => {
    expect(validateName("  Priya  ")).toEqual({ valid: true });
  });
});

describe("validateEmail", () => {
  it("rejects empty emails", () => {
    expect(validateEmail("")).toEqual({ valid: false, message: "Email is required." });
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

describe("validateLanguage", () => {
  it("rejects empty language", () => {
    expect(validateLanguage("")).toEqual({
      valid: false,
      message: "Please select a language.",
    });
  });

  it("accepts a selected language", () => {
    expect(validateLanguage("Hindi")).toEqual({ valid: true });
  });
});

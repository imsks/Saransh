import { describe, expect, it } from "vitest";

import { validateEmail, validateName, validateWaitlist } from "./validate";

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

describe("validateWaitlist", () => {
  it("returns no errors for a valid signup", () => {
    expect(validateWaitlist({ name: "Priya Sharma", email: "priya@example.com" })).toEqual({});
  });

  it("reports only the field that is wrong", () => {
    expect(validateWaitlist({ name: "Priya Sharma", email: "not-an-email" })).toEqual({
      email: "Please enter a valid email address.",
    });
    expect(validateWaitlist({ name: "A", email: "priya@example.com" })).toEqual({
      name: "Please enter your real name.",
    });
  });

  it("reports both fields when both are wrong", () => {
    expect(validateWaitlist({ name: "", email: "" })).toEqual({
      name: "Please enter your real name.",
      email: "Please enter a valid email address.",
    });
  });
});

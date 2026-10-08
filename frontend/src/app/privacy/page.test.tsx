// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@sutra_ui/ui";

import PrivacyPage, { metadata } from "./page";

beforeEach(() => {
  // The page renders the Navbar, whose theme switch reads the colour-scheme query.
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPage() {
  render(
    <ThemeProvider>
      <PrivacyPage />
    </ThemeProvider>,
  );
}

function body(): string {
  return document.body.textContent ?? "";
}

describe("PrivacyPage", () => {
  it("renders the privacy heading", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Privacy" })).toBeTruthy();
  });

  it("states that the email address never reaches the analytics vendor", () => {
    renderPage();

    expect(body()).toContain("Your email address is never sent to the analytics vendor.");
  });

  it("covers every disclosure the page exists to make", () => {
    renderPage();

    const text = body();
    for (const heading of [
      "Joining the waitlist",
      "Anonymous usage analytics",
      "How a signup is linked to usage",
      "Session recording",
      "Analytics served from our own domain",
      "Who holds the data",
      "Deleting your data",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeTruthy();
    }

    expect(text).toContain("one email when Saransh launches");
    expect(text).toContain("opaque token");
    expect(text).toContain("Recordings never capture what you type into form fields.");
    expect(text).toContain("PostHog");
    expect(text).toContain("United States");
  });

  it("carries page metadata", () => {
    expect(metadata.title).toBe("Privacy");
    expect(typeof metadata.description).toBe("string");
  });
});

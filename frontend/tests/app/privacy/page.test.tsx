import { cleanup, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";

import { ThemeProvider } from "@sutra_ui/ui";

import PrivacyPage, { metadata } from "@/app/privacy/page";
import { ROUTES } from "@/lib/routes";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

beforeEach(() => {
  // The page renders the Navbar, whose theme switch reads the colour-scheme query.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
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

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy" }),
    ).toBeTruthy();
  });

  it("states that the email address never reaches the analytics vendor", () => {
    renderPage();

    expect(body()).toContain(
      "Your email address is never sent to the analytics vendor.",
    );
  });

  it("covers every disclosure the page exists to make", () => {
    renderPage();

    const text = body();
    for (const heading of [
      "Signing in with Google",
      "Usage analytics",
      "Session recording",
      "Analytics served from our own domain",
      "Who holds the data",
      "Deleting your data",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: heading }),
      ).toBeTruthy();
    }

    expect(text).toContain("stores these preferences in its own table");
    expect(text).toContain("does not write to your Rajniti profile");
    expect(text).not.toContain("shared with Rajniti");
    expect(text).toContain("joined to your account ID");
    expect(text).toContain(
      "We do not record sessions or capture what you type into form fields.",
    );
    expect(text).toContain("PostHog");
    expect(text).toContain("United States");
    expect(text).toContain("Your account details stay in our own database");
  });

  it("shares the site frame, including the navbar's Contribute link", () => {
    renderPage();

    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Contribute" }).getAttribute("href"),
    ).toBe(ROUTES.contribute);
  });

  it("carries page metadata", () => {
    expect(metadata.title).toBe("Privacy");
    expect(typeof metadata.description).toBe("string");
  });
});

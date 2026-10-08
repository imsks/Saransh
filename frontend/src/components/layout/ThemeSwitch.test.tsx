// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@sutra_ui/ui";

import ThemeSwitch from "./ThemeSwitch";

beforeEach(() => {
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

describe("ThemeSwitch", () => {
  it("renders no theme-dependent markup on the server", () => {
    const html = renderToString(
      <ThemeProvider>
        <ThemeSwitch />
      </ThemeProvider>,
    );

    expect(html).not.toContain("<button");
    expect(html).not.toContain("<svg");
  });

  it("shows the toggle once mounted in the browser", () => {
    render(
      <ThemeProvider>
        <ThemeSwitch />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: /switch to (dark|light) theme/i })).toBeTruthy();
  });
});

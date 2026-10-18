const { TextEncoder, TextDecoder } = require("node:util");

Object.defineProperty(globalThis, "TextEncoder", {
  value: TextEncoder,
  configurable: true,
});
Object.defineProperty(globalThis, "TextDecoder", {
  value: TextDecoder,
  configurable: true,
});

const { cleanup, render, screen } = require("@testing-library/react");
const { renderToString } = require("react-dom/server");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");

const { ThemeProvider } = require("@sutra_ui/ui");

import ThemeSwitch from "@/components/layout/ThemeSwitch";

beforeEach(() => {
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

    expect(
      screen.getByRole("button", { name: /switch to (dark|light) theme/i }),
    ).toBeTruthy();
  });
});

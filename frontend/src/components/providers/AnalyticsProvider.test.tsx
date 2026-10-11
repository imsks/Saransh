// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import AnalyticsProvider from "./AnalyticsProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams("ref=hn"),
}));

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("AnalyticsProvider", () => {
  it("renders children on the server without booting analytics", () => {
    const html = renderToString(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(html).toContain("hello");
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("captures a pageview when a key is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");

    render(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(screen.getByText("hello")).toBeDefined();
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: `${window.location.origin}/?ref=hn`,
    });
  });

  it("makes no request when no key is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(screen.getByText("hello")).toBeDefined();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

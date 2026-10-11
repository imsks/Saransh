// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import AnalyticsProvider from "@/components/providers/AnalyticsProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams("ref=hn"),
}));

const analytics = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({ analytics }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function setPageGeometry(scrollY: number, innerHeight: number, scrollHeight: number) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
}

describe("AnalyticsProvider", () => {
  it("renders children on the server without booting analytics", () => {
    const html = renderToString(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(html).toContain("hello");
    expect(analytics.init).not.toHaveBeenCalled();
  });

  it("boots analytics and captures the pageview with its query string", () => {
    render(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(screen.getByText("hello")).toBeDefined();
    expect(analytics.init).toHaveBeenCalledTimes(1);
    expect(analytics.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: `${window.location.origin}/?ref=hn`,
    });
  });

  it("reports each scroll milestone once per page view", () => {
    // Frames run when the test says so, as the browser runs them after the scroll.
    let frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (run: FrameRequestCallback) => frames.push(run));
    const nextFrame = () => {
      const due = frames;
      frames = [];
      due.forEach((run) => run(0));
    };
    render(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    setPageGeometry(1000, 1000, 4000);
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    nextFrame();
    window.dispatchEvent(new Event("scroll"));
    nextFrame();
    setPageGeometry(3000, 1000, 4000);
    window.dispatchEvent(new Event("scroll"));
    nextFrame();

    const depths = analytics.capture.mock.calls
      .filter(([event]) => event === "scroll_depth_reached")
      .map(([, properties]) => properties.depth);
    expect(depths).toEqual([25, 50, 75, 100]);
  });
});

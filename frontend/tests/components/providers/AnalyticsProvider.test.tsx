import { cleanup, render, screen } from "@testing-library/react";
import { TextEncoder } from "util";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import type AnalyticsProviderComponent from "@/components/providers/AnalyticsProvider";
import { analytics } from "@/lib/analytics";

// Outside the App Router there is no pathname; stand one in. The provider is
// loaded after this, so it picks up the stand-in.
let mockQuery = "ref=hn";
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(mockQuery),
}));

let AnalyticsProvider: typeof AnalyticsProviderComponent;
beforeAll(async () => {
  ({ default: AnalyticsProvider } =
    await import("@/components/providers/AnalyticsProvider"));
});

// Spy on the real client: no SDK boots, and every call lands here.
let init: jest.SpiedFunction<typeof analytics.init>;
let capture: jest.SpiedFunction<typeof analytics.capture>;
beforeEach(() => {
  mockQuery = "ref=hn";
  init = jest.spyOn(analytics, "init").mockImplementation(() => {});
  capture = jest.spyOn(analytics, "capture").mockImplementation(() => {});
});

const realRequestAnimationFrame = window.requestAnimationFrame;

afterEach(() => {
  cleanup();
  window.requestAnimationFrame = realRequestAnimationFrame;
  jest.restoreAllMocks();
});

function setPageGeometry(
  scrollY: number,
  innerHeight: number,
  scrollHeight: number,
) {
  Object.defineProperty(window, "scrollY", {
    value: scrollY,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: innerHeight,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
}

describe("AnalyticsProvider", () => {
  it("renders children on the server without booting analytics", async () => {
    // jsdom lacks TextEncoder, which React's server renderer needs to load.
    Object.assign(globalThis, { TextEncoder });
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(html).toContain("hello");
    expect(init).not.toHaveBeenCalled();
  });

  it("boots analytics and captures the pageview with its query string", () => {
    render(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );

    expect(screen.getByText("hello")).toBeDefined();
    expect(init).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: `${window.location.origin}/?ref=hn`,
    });
  });

  it("reports each scroll milestone once per page view", () => {
    // Frames run when the test says so, as the browser runs them after the scroll.
    let frames: FrameRequestCallback[] = [];
    window.requestAnimationFrame = (run: FrameRequestCallback) =>
      frames.push(run);
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

    const depths = capture.mock.calls
      .filter(([event]) => event === "scroll_depth_reached")
      .map(([, properties]) => (properties as { depth: number }).depth);
    expect(depths).toEqual([25, 50, 75, 100]);
  });

  it("resets scroll milestones for query-only navigation, not unchanged renders", () => {
    let frame: FrameRequestCallback | undefined;
    window.requestAnimationFrame = (run) => {
      frame = run;
      return 1;
    };
    const measure = () => {
      window.dispatchEvent(new Event("scroll"));
      frame?.(0);
    };
    const { rerender } = render(
      <AnalyticsProvider>
        <p>hello</p>
      </AnalyticsProvider>,
    );
    setPageGeometry(1000, 1000, 4000);
    measure();
    rerender(
      <AnalyticsProvider>
        <p>unchanged route</p>
      </AnalyticsProvider>,
    );
    measure();
    expect(
      capture.mock.calls.filter(([event]) => event === "$pageview"),
    ).toHaveLength(1);
    expect(
      capture.mock.calls.filter(([event]) => event === "scroll_depth_reached"),
    ).toHaveLength(2);

    mockQuery = "ref=github";
    rerender(
      <AnalyticsProvider>
        <p>new query</p>
      </AnalyticsProvider>,
    );
    measure();
    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: `${window.location.origin}/?ref=github`,
    });
    const depths = capture.mock.calls
      .filter(([event]) => event === "scroll_depth_reached")
      .map(([, properties]) => (properties as { depth: number }).depth);
    expect(depths).toEqual([25, 50, 25, 50]);
  });
});

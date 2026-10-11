import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAnalyticsClient, type AnalyticsTransport } from "./client";
import type { AnalyticsConfig } from "./config";

const ENABLED: AnalyticsConfig = {
  enabled: true,
  key: "phc_test",
  host: "https://us.i.posthog.com",
};
const DISABLED: AnalyticsConfig = { enabled: false, key: "", host: ENABLED.host };

/** Stand-in for the PostHog SDK: no browser, no network, no vendor code. */
function createFakeTransport() {
  return {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  } satisfies AnalyticsTransport;
}

// These tests run in the node environment, so `window` is absent unless stubbed.
function withBrowser() {
  vi.stubGlobal("window", { location: { origin: "https://saransh.app" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createAnalyticsClient", () => {
  describe("with a key configured", () => {
    beforeEach(withBrowser);

    it("boots the transport with autocapture on and pageviews off", () => {
      const transport = createFakeTransport();
      createAnalyticsClient(transport, ENABLED).init();

      expect(transport.init).toHaveBeenCalledWith("phc_test", {
        api_host: ENABLED.host,
        autocapture: true,
        capture_pageview: false,
      });
    });

    it("boots only once", () => {
      const transport = createFakeTransport();
      const analytics = createAnalyticsClient(transport, ENABLED);
      analytics.init();
      analytics.init();

      expect(transport.init).toHaveBeenCalledTimes(1);
    });

    it("forwards captures, identifies, and resets once booted", () => {
      const transport = createFakeTransport();
      const analytics = createAnalyticsClient(transport, ENABLED);
      analytics.init();

      analytics.capture("$pageview", { $current_url: "https://saransh.app/" });
      analytics.identify("signup-token");
      analytics.reset();

      expect(transport.capture).toHaveBeenCalledWith("$pageview", {
        $current_url: "https://saransh.app/",
      });
      expect(transport.identify).toHaveBeenCalledWith("signup-token", undefined);
      expect(transport.reset).toHaveBeenCalledTimes(1);
    });

    it("sends nothing before init", () => {
      const transport = createFakeTransport();
      const analytics = createAnalyticsClient(transport, ENABLED);

      analytics.capture("$pageview", { $current_url: "https://saransh.app/" });

      expect(transport.capture).not.toHaveBeenCalled();
    });

    it("swallows transport failures", () => {
      const transport = createFakeTransport();
      transport.capture.mockImplementation(() => {
        throw new Error("sdk exploded");
      });
      const analytics = createAnalyticsClient(transport, ENABLED);
      analytics.init();

      expect(() =>
        analytics.capture("$pageview", { $current_url: "https://saransh.app/" }),
      ).not.toThrow();
    });
  });

  describe("the event map", () => {
    it("rejects untyped and wrongly-shaped capture calls at compile time", () => {
      const analytics = createAnalyticsClient(createFakeTransport(), DISABLED);

      // @ts-expect-error — a bare string is not an event in the map.
      analytics.capture("waitlist_submitted", {});
      // @ts-expect-error — the payload must match the event's declared shape.
      analytics.capture("$pageview", { current_url: "https://saransh.app/" });
    });
  });

  describe("with no key configured", () => {
    it("makes every entry point a no-op", () => {
      withBrowser();
      const transport = createFakeTransport();
      const analytics = createAnalyticsClient(transport, DISABLED);

      analytics.init();
      analytics.capture("$pageview", { $current_url: "https://saransh.app/" });
      analytics.identify("signup-token");
      analytics.reset();

      expect(transport.init).not.toHaveBeenCalled();
      expect(transport.capture).not.toHaveBeenCalled();
      expect(transport.identify).not.toHaveBeenCalled();
      expect(transport.reset).not.toHaveBeenCalled();
    });
  });

  describe("during server-side rendering", () => {
    it("is safe to call every entry point without a window", () => {
      const transport = createFakeTransport();
      const analytics = createAnalyticsClient(transport, ENABLED);

      expect(() => {
        analytics.init();
        analytics.capture("$pageview", { $current_url: "https://saransh.app/" });
        analytics.identify("signup-token");
        analytics.reset();
      }).not.toThrow();

      expect(transport.init).not.toHaveBeenCalled();
      expect(transport.capture).not.toHaveBeenCalled();
    });
  });
});

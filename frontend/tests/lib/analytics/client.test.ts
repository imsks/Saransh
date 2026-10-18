/**
 * @jest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  createAnalyticsClient,
  type AnalyticsTransport,
} from "@/lib/analytics/client";
import type { AnalyticsConfig } from "@/lib/analytics/config";

const ENABLED: AnalyticsConfig = {
  enabled: true,
  key: "phc_test",
  host: "/ingest",
};
const DISABLED: AnalyticsConfig = { ...ENABLED, enabled: false, key: "" };

/** Stand-in for the PostHog SDK: no browser, no network, no vendor code. */
function createFakeTransport() {
  return {
    init: jest.fn<AnalyticsTransport["init"]>(),
    capture: jest.fn<AnalyticsTransport["capture"]>(),
    identify: jest.fn<AnalyticsTransport["identify"]>(),
    reset: jest.fn<AnalyticsTransport["reset"]>(),
  } satisfies AnalyticsTransport;
}

// These tests run in the node environment, so `window` is absent unless stubbed.
const globals = globalThis as { window?: unknown };
function withBrowser() {
  globals.window = { location: { origin: "https://saransh.app" } };
}

function booted(config: AnalyticsConfig = ENABLED) {
  const transport = createFakeTransport();
  const analytics = createAnalyticsClient(transport, {
    config,
  });
  analytics.init();
  return { transport, analytics };
}

afterEach(() => {
  delete globals.window;
  jest.restoreAllMocks();
});

describe("createAnalyticsClient", () => {
  describe("with a key configured", () => {
    beforeEach(withBrowser);

    it("boots with autocapture on, manual pageviews, and inputs masked", () => {
      const { transport } = booted();

      expect(transport.init).toHaveBeenCalledWith(
        "phc_test",
        expect.objectContaining({
          api_host: "/ingest",
          autocapture: true,
          capture_pageview: false,
          capture_pageleave: true,
          disable_session_recording: true,
          session_recording: { maskAllInputs: true },
        }),
      );
    });

    it("boots only once", () => {
      const { transport, analytics } = booted();
      analytics.init();

      expect(transport.init).toHaveBeenCalledTimes(1);
    });

    it("delivers a captured event with its declared payload", () => {
      const { transport, analytics } = booted();

      analytics.capture("waitlist_submitted", { outcome: "created" });

      expect(transport.capture).toHaveBeenCalledWith(
        "waitlist_submitted",
        { outcome: "created" },
        undefined,
      );
    });

    it("sends by beacon when asked, for clicks that leave the page", () => {
      const { transport, analytics } = booted();

      analytics.capture(
        "outbound_link_clicked",
        { destination: "github", placement: "navbar" },
        { beacon: true },
      );

      expect(transport.capture).toHaveBeenCalledWith(
        "outbound_link_clicked",
        { destination: "github", placement: "navbar" },
        { transport: "sendBeacon" },
      );
    });

    it("identifies by the Signup Token alone", () => {
      const { transport, analytics } = booted();

      analytics.identify("5b8f0c1e-signup-token");

      expect(transport.identify).toHaveBeenCalledTimes(1);
      expect(transport.identify.mock.calls[0]).toEqual(["5b8f0c1e-signup-token"]);
    });

    it("forwards a reset", () => {
      const { transport, analytics } = booted();

      analytics.reset();

      expect(transport.reset).toHaveBeenCalledTimes(1);
    });

    it("does not identify with an empty token", () => {
      const { transport, analytics } = booted();

      analytics.identify("");

      expect(transport.identify).not.toHaveBeenCalled();
    });

    it("sends nothing before init", () => {
      const transport = createFakeTransport();
      const analytics = createAnalyticsClient(transport, { config: ENABLED });

      analytics.capture("waitlist_form_viewed", {});

      expect(transport.capture).not.toHaveBeenCalled();
    });

    it("swallows transport failures", () => {
      const { transport, analytics } = booted();
      jest.spyOn(console, "warn").mockImplementation(() => {});
      transport.capture.mockImplementation(() => {
        throw new Error("sdk exploded");
      });

      expect(() => analytics.capture("waitlist_form_viewed", {})).not.toThrow();
    });
  });

  describe("session replay", () => {
    beforeEach(withBrowser);

    it("always disables recording", () => {
      const { transport } = booted();

      expect(transport.init).toHaveBeenCalledWith(
        "phc_test",
        expect.objectContaining({ disable_session_recording: true }),
      );
    });
  });

  describe("the event map", () => {
    it("rejects untyped and wrongly-shaped capture calls at compile time", () => {
      const analytics = createAnalyticsClient(createFakeTransport(), { config: DISABLED });

      // @ts-expect-error — a bare string is not an event in the map.
      analytics.capture("waitlist_joined", {});
      // @ts-expect-error — the payload must match the event's declared shape.
      analytics.capture("waitlist_submitted", { outcome: "maybe" });
      // @ts-expect-error — identify takes the Signup Token and no personal fields.
      analytics.identify("token", { email: "priya@example.com" });
    });
  });

  describe("with no key configured", () => {
    it("makes every entry point a no-op", () => {
      withBrowser();
      const { transport, analytics } = booted(DISABLED);

      analytics.capture("waitlist_form_viewed", {});
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
      const analytics = createAnalyticsClient(transport, { config: ENABLED });

      expect(() => {
        analytics.init();
        analytics.capture("waitlist_form_viewed", {});
        analytics.identify("signup-token");
        analytics.reset();
      }).not.toThrow();

      expect(transport.init).not.toHaveBeenCalled();
      expect(transport.capture).not.toHaveBeenCalled();
    });
  });
});

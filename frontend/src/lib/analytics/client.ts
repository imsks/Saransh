import { logger } from "@/lib/logger";

import {
  POSTHOG_UI_HOST,
  readAnalyticsConfig,
  type AnalyticsConfig,
} from "./config";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events";

/** Options handed to the transport on boot; snake_case mirrors PostHog's SDK. */
export interface AnalyticsInitOptions {
  api_host: string;
  ui_host: string;
  /** Autocapture is on for breadth; funnels are built on explicit events only. */
  autocapture: boolean;
  /** The provider fires pageviews itself so client-side navigations count. */
  capture_pageview: boolean;
  /** Page-leave events carry how far down the page the Visitor got. */
  capture_pageleave: boolean;
  /** Funnels and analytics do not need session recording. */
  disable_session_recording: boolean;
  session_recording: { maskAllInputs: boolean };
}

/** Per-call options handed to the transport. */
export interface AnalyticsCaptureOptions {
  /** Survives the page unloading straight after, as an outbound click may. */
  transport?: "sendBeacon";
}

/**
 * The port the client sends through. PostHog's SDK satisfies it, and so does a
 * fake — which is what lets the client be unit-tested with no browser, no
 * network, and no real SDK.
 */
export interface AnalyticsTransport {
  init(key: string, options: AnalyticsInitOptions): void;
  capture(
    event: string,
    properties?: Record<string, unknown>,
    options?: AnalyticsCaptureOptions,
  ): void;
  identify(distinctId: string): void;
  reset(): void;
}

export interface CaptureCallOptions {
  /** Send with `sendBeacon`, for a click that may navigate away. */
  beacon?: boolean;
}

export interface AnalyticsClient {
  /** Boots the transport. Safe to call repeatedly; only the first call lands. */
  init(): void;
  capture<Event extends AnalyticsEventName>(
    event: Event,
    properties: AnalyticsEventMap[Event],
    options?: CaptureCallOptions,
  ): void;
  /**
   * Ties this Visitor to a Waitlist Signup. Takes the Signup Token and nothing
   * else, so no name or email can ever be passed along with it.
   */
  identify(signupToken: string): void;
  reset(): void;
}

/**
 * Analytics must never be the reason a page breaks, so a throwing transport is
 * logged and swallowed rather than propagated to the caller.
 */
function guard(action: string, run: () => void): void {
  try {
    run();
  } catch (error) {
    logger.warn({ err: error, action }, "analytics call failed");
  }
}

export interface AnalyticsClientDeps {
  /** Read on `init`, not on construction, so the client can be built at module load. */
  config?: AnalyticsConfig;
}

/**
 * Build an analytics client over an injected transport.
 *
 * Every entry point is a no-op when no PostHog key is configured, and when
 * there is no `window` — so server-side rendering can call any of them safely.
 */
export function createAnalyticsClient(
  transport: AnalyticsTransport,
  { config }: AnalyticsClientDeps = {},
): AnalyticsClient {
  let started = false;

  const active = (): boolean => started && typeof window !== "undefined";

  return {
    init() {
      if (started || typeof window === "undefined") return;
      const settings = config ?? readAnalyticsConfig();
      if (!settings.enabled) return;
      started = true;

      guard("init", () =>
        transport.init(settings.key, {
          api_host: settings.host,
          ui_host: POSTHOG_UI_HOST,
          autocapture: true,
          capture_pageview: false,
          capture_pageleave: true,
          disable_session_recording: true,
          // The waitlist form holds the only text inputs on the site; nothing typed is recorded.
          session_recording: { maskAllInputs: true },
        }),
      );
    },

    capture(event, properties, options) {
      if (!active()) return;
      guard("capture", () =>
        transport.capture(
          event,
          properties,
          options?.beacon ? { transport: "sendBeacon" } : undefined,
        ),
      );
    },

    identify(signupToken) {
      if (!active() || !signupToken) return;
      guard("identify", () => transport.identify(signupToken));
    },

    reset() {
      if (!active()) return;
      guard("reset", () => transport.reset());
    },
  };
}

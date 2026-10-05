import { logger } from "@/lib/logger";

import { readAnalyticsConfig, type AnalyticsConfig } from "./config";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events";

/** Options handed to the transport on boot; snake_case mirrors PostHog's SDK. */
export interface AnalyticsInitOptions {
  api_host: string;
  /** Autocapture is on for breadth; funnels are built on explicit events only. */
  autocapture: boolean;
  /** The provider fires pageviews itself so client-side navigations count. */
  capture_pageview: boolean;
}

/**
 * The port the client sends through. PostHog's SDK satisfies it, and so does a
 * fake — which is what lets the client be unit-tested with no browser, no
 * network, and no real SDK.
 */
export interface AnalyticsTransport {
  init(key: string, options: AnalyticsInitOptions): void;
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

export interface AnalyticsClient {
  /** Boots the transport. Safe to call repeatedly; only the first call lands. */
  init(): void;
  capture<Event extends AnalyticsEventName>(
    event: Event,
    properties: AnalyticsEventMap[Event],
  ): void;
  identify(distinctId: string, properties?: Record<string, unknown>): void;
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

/**
 * Build an analytics client over an injected transport.
 *
 * Every entry point is a no-op when no PostHog key is configured, and when
 * there is no `window` — so server-side rendering can call any of them safely.
 */
export function createAnalyticsClient(
  transport: AnalyticsTransport,
  config: AnalyticsConfig = readAnalyticsConfig(),
): AnalyticsClient {
  let started = false;

  const active = (): boolean =>
    config.enabled && typeof window !== "undefined" && started;

  return {
    init() {
      if (started || !config.enabled || typeof window === "undefined") return;
      started = true;
      guard("init", () =>
        transport.init(config.key, {
          api_host: config.host,
          autocapture: true,
          capture_pageview: false,
        }),
      );
    },

    capture(event, properties) {
      if (!active()) return;
      guard("capture", () => transport.capture(event, properties));
    },

    identify(distinctId, properties) {
      if (!active()) return;
      guard("identify", () => transport.identify(distinctId, properties));
    },

    reset() {
      if (!active()) return;
      guard("reset", () => transport.reset());
    },
  };
}

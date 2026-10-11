import type { PostHog } from "posthog-js";

import { logger } from "@/lib/logger";

import type { AnalyticsTransport } from "./client";

type Call = (sdk: PostHog) => void;

const loadPostHog = (): Promise<PostHog> =>
  import("posthog-js").then((module) => module.default);

/**
 * The PostHog SDK behind the transport port, loaded on first `init` rather
 * than at import. The SDK stays out of the initial bundle — the landing page
 * paints without it — and with no key configured it is never fetched at all.
 * Calls made while it downloads are queued and replayed in order.
 */
export function createPostHogTransport(
  load: () => Promise<PostHog> = loadPostHog,
): AnalyticsTransport {
  let sdk: PostHog | null = null;
  let failed = false;
  let pending: Call[] = [];

  function run(call: Call) {
    if (failed) return;
    if (!sdk) {
      pending.push(call);
      return;
    }
    try {
      call(sdk);
    } catch (error) {
      logger.warn({ err: error }, "analytics call failed");
    }
  }

  function boot() {
    load()
      .then((loaded) => {
        sdk = loaded;
        const queued = pending;
        pending = [];
        queued.forEach(run);
      })
      .catch((error) => {
        // A blocked or failed download leaves the page exactly as it was.
        failed = true;
        pending = [];
        logger.warn({ err: error }, "analytics sdk failed to load");
      });
  }

  return {
    init(key, options) {
      run((posthog) => posthog.init(key, options));
      boot();
    },
    capture(event, properties, options) {
      run((posthog) => posthog.capture(event, properties, options));
    },
    identify(distinctId) {
      run((posthog) => posthog.identify(distinctId));
    },
    reset() {
      run((posthog) => posthog.reset());
    },
    startSessionRecording() {
      run((posthog) => posthog.startSessionRecording());
    },
  };
}

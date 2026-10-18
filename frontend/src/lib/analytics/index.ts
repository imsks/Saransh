import { createAnalyticsClient } from "./client";
import { createPostHogTransport } from "./posthog-transport";

/**
 * The app's one analytics client. Import this — never `posthog-js` directly —
 * so every event goes through the typed map and the disabled-by-default guard.
 */
export const analytics = createAnalyticsClient(createPostHogTransport());

export type { AnalyticsEventMap, AnalyticsEventName, LinkPlacement } from "./events";

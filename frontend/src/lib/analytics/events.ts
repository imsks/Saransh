/**
 * The analytics event map: every event Saransh sends, with the exact shape of
 * its payload. It exists only at compile time — nothing here survives into the
 * bundle — but it is what makes a bare string event name or a wrongly-shaped
 * payload a type error instead of a silently malformed row in PostHog.
 *
 * Autocapture covers the questions nobody thought to ask yet; events declared
 * here are the ones a funnel may be defined on (see
 * `docs/adr/0004-posthog-for-saransh-analytics.md`).
 */
export interface AnalyticsEventMap {
  /** PostHog's built-in pageview, fired by hand on every route change. */
  $pageview: { $current_url: string };
}

/** Every event name the client will accept. */
export type AnalyticsEventName = keyof AnalyticsEventMap;

/** The payload required for a given event name. */
export type AnalyticsEventProperties<Event extends AnalyticsEventName> =
  AnalyticsEventMap[Event];

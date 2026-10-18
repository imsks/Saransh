/**
 * The analytics event map: every event Saransh sends, with the exact shape of
 * its payload. It exists only at compile time — nothing here survives into the
 * bundle — but it is what makes a bare string event name or a wrongly-shaped
 * payload a type error instead of a silently malformed row in PostHog.
 *
 * Autocapture covers the questions nobody thought to ask yet; events declared
 * here are the ones a funnel may be defined on (see
 * `docs/adr/0004-posthog-for-saransh-analytics.md`). No payload may carry a
 * name, an email, or anything else that identifies a person.
 */

/** How a waitlist submission resolved. Client-side validation errors are not submissions. */
export type WaitlistOutcome = "created" | "duplicate" | "failed";

/** Where on the page an outbound link sits, so placements can be told apart. */
export type LinkPlacement = "navbar" | "footer" | "thank_you" | "rajniti_section";

/** The coarse scroll milestones, as a percentage of the page. */
export type ScrollDepth = 25 | 50 | 75 | 100;

export interface AnalyticsEventMap {
  /** PostHog's built-in pageview, fired by hand on every route change. */
  $pageview: { $current_url: string };

  /** Funnel step 1: the waitlist form became visible. Once per page view. */
  waitlist_form_viewed: Record<string, never>;
  /** Funnel step 2: the Visitor first interacted with the form. Once per session. */
  waitlist_form_started: { field: "name" | "email" };
  /**
   * Funnel step 3: a submission came back. `created` is the conversion;
   * `duplicate` is an email already on the list; `failed` is the backend or
   * the network, carrying the HTTP status when there was one.
   */
  waitlist_submitted: { outcome: WaitlistOutcome; status?: number };

  /** The Visitor moved the Story carousel themselves. `position` is 1-based, after the move. */
  story_carousel_advanced: {
    direction: "next" | "back";
    method: "button" | "swipe";
    position: number;
    total: number;
    sample: boolean;
  };
  /** The Visitor followed a Citation Link out to a Story's source Article. */
  citation_link_clicked: {
    source: string;
    headline: string;
    link: "source_line" | "read_story";
  };
  /** The Visitor left for GitHub or Rajniti. */
  outbound_link_clicked: {
    destination: "github" | "rajniti";
    placement: LinkPlacement;
  };
  /** The Visitor scrolled past a milestone. Each milestone at most once per page view. */
  scroll_depth_reached: { depth: ScrollDepth };
}

/** Every event name the client will accept. */
export type AnalyticsEventName = keyof AnalyticsEventMap;

/** The payload required for a given event name. */
export type AnalyticsEventProperties<Event extends AnalyticsEventName> =
  AnalyticsEventMap[Event];

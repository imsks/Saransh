"use client";

import type { AnchorHTMLAttributes } from "react";

import { analytics, type AnalyticsEventMap, type AnalyticsEventName } from "@/lib/analytics";

type TrackedLinkProps<Event extends AnalyticsEventName> =
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    event: Event;
    properties: AnalyticsEventMap[Event];
  };

/**
 * An `<a>` that reports a typed event when followed. The event goes by
 * `sendBeacon`, so it still lands if the click navigates the page away. Lets
 * server components keep their links while the click is measured on the client.
 */
export default function TrackedLink<Event extends AnalyticsEventName>({
  event,
  properties,
  onClick,
  onAuxClick,
  ...anchor
}: TrackedLinkProps<Event>) {
  const report = () => analytics.capture(event, properties, { beacon: true });

  return (
    <a
      {...anchor}
      onClick={(e) => {
        report();
        onClick?.(e);
      }}
      // A middle click opens the link in a new tab without firing `click`.
      onAuxClick={(e) => {
        if (e.button === 1) report();
        onAuxClick?.(e);
      }}
    />
  );
}

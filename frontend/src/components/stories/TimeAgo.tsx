"use client";

import { useEffect, useState } from "react";

import { timeAgo } from "@/lib/time-ago";

/**
 * "4 hours ago", worked out again in the browser: a cached page would
 * otherwise keep the time it was rendered at.
 */
export default function TimeAgo({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => setNow(Date.now()), []);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {timeAgo(iso, now)}
    </time>
  );
}

"use client";

import { useEffect, useState } from "react";

import { timeAgo } from "@/lib/time-ago";

/** Recomputed in the browser, or a cached page would keep the time it was rendered at. */
export default function TimeAgo({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => setNow(Date.now()), []);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {timeAgo(iso, now)}
    </time>
  );
}

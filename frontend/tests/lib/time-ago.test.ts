import { describe, expect, it } from "@jest/globals";

import { timeAgo } from "@/lib/time-ago";

const NOW = new Date("2026-11-24T12:00:00Z").getTime();
const before = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;

describe("timeAgo", () => {
  it.each([
    [0, "Just now"],
    [59_000, "Just now"],
    [MIN, "1 minute ago"],
    [45 * MIN, "45 minutes ago"],
    [60 * MIN, "1 hour ago"],
    [23 * 60 * MIN, "23 hours ago"],
    [24 * 60 * MIN, "1 day ago"],
    [3 * 24 * 60 * MIN, "3 days ago"],
  ])("%i ms ago reads %s", (ms, text) => {
    expect(timeAgo(before(ms), NOW)).toBe(text);
  });

  it("treats a time slightly in the future, or an unreadable one, as just now", () => {
    expect(timeAgo(before(-5_000), NOW)).toBe("Just now");
    expect(timeAgo("not a date", NOW)).toBe("Just now");
  });
});

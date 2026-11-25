const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();

  if (!(elapsed >= MINUTE)) return "Just now";
  if (elapsed < HOUR) return ago(Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return ago(Math.floor(elapsed / HOUR), "hour");
  return ago(Math.floor(elapsed / DAY), "day");
}

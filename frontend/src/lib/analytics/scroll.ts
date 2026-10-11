import type { ScrollDepth } from "./events";

export const SCROLL_MILESTONES: readonly ScrollDepth[] = [25, 50, 75, 100];

/**
 * How far down the page the bottom of the viewport sits, from 0 to 1. A page
 * shorter than the viewport counts as fully seen.
 */
export function scrollFraction(
  scrollTop: number,
  viewportHeight: number,
  documentHeight: number,
): number {
  if (documentHeight <= viewportHeight) return 1;
  return Math.min(1, Math.max(0, (scrollTop + viewportHeight) / documentHeight));
}

/**
 * The milestones `fraction` has passed that are not yet in `reported`, lowest
 * first. 100 needs the last couple of pixels to be forgiven, since a viewport
 * rarely lands exactly on the bottom.
 */
export function newMilestones(
  fraction: number,
  reported: ReadonlySet<ScrollDepth>,
): ScrollDepth[] {
  const percent = fraction * 100;
  return SCROLL_MILESTONES.filter(
    (depth) => !reported.has(depth) && percent >= (depth === 100 ? 99 : depth),
  );
}

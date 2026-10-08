/**
 * Web button styles from the design system: mono, uppercase, 2px corners.
 * Shared so the four landing-page buttons cannot drift apart again.
 */
const base =
  "inline-flex min-h-11 items-center justify-center rounded-[2px] px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

/** Filled ink, paper text, turns red on hover. */
export const primaryButtonClass = `${base} bg-ink text-paper hover:bg-red`;

/** Outlined: ink border in light, the heavier line colour in dark. */
export const secondaryButtonClass = `${base} border-[1.5px] border-ink bg-transparent text-ink dark:border-line-heavy dark:hover:border-ink`;

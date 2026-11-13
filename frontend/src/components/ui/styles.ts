/**
 * Saransh's visual language in one place: rounded cards and controls on
 * newsprint paper. Plain class maps, so server and client components share them.
 */

type ClassValue = string | false | null | undefined;

/** Joins truthy class names. No conflict resolution: add layout classes, not overrides. */
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export type CardVariant = "elevated" | "outlined" | "info";
export type CardPadding = "none" | "md" | "lg";

const CARD_VARIANT: Record<CardVariant, string> = {
  elevated: "border border-edge bg-card shadow-app-card",
  outlined: "border border-edge bg-card",
  info: "border border-blue/25 bg-blue-tint",
};

const CARD_PADDING: Record<CardPadding, string> = {
  none: "",
  md: "p-6 max-[560px]:p-5",
  lg: "p-8 max-[560px]:p-6",
};

/** The card surface. Every card on the site takes its curve and edge from here. */
export function cardClass({
  variant = "outlined",
  padding = "md",
}: { variant?: CardVariant; padding?: CardPadding } = {}): string {
  return cx("rounded-3xl", CARD_VARIANT[variant], CARD_PADDING[padding]);
}

export type ButtonVariant = "primary" | "secondary";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-red disabled:bg-line-heavy",
  secondary:
    "border-[1.5px] border-ink bg-transparent text-ink hover:bg-card dark:border-line-heavy dark:hover:border-ink",
};

/** Mono, uppercase, rounded to match the cards. For buttons and links alike. */
export function buttonClass({
  variant = "primary",
  fullWidth = false,
}: { variant?: ButtonVariant; fullWidth?: boolean } = {}): string {
  return cx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:cursor-not-allowed",
    BUTTON_VARIANT[variant],
    fullWidth && "w-full",
  );
}

export type EyebrowTone = "muted" | "accent" | "info";

const EYEBROW_TONE: Record<EyebrowTone, string> = {
  muted: "text-muted",
  accent: "text-red",
  info: "text-blue",
};

/** The small mono label above a heading or form. */
export function eyebrowClass(tone: EyebrowTone = "muted"): string {
  return cx(
    "block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]",
    EYEBROW_TONE[tone],
  );
}

/** A tinted rounded square that holds a section icon. */
export const iconChipClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-tint text-red";

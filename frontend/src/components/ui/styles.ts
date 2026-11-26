type ClassValue = string | false | null | undefined;

export const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

/** No conflict resolution: add layout classes, not overrides. */
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

export function cardClass({
  variant = "outlined",
  padding = "md",
}: { variant?: CardVariant; padding?: CardPadding } = {}): string {
  return cx("rounded-3xl", CARD_VARIANT[variant], CARD_PADDING[padding]);
}

/**
 * Primary fades on hover and press; action is the one main action on a screen and
 * turns red, so a screen never has two red actions; secondary is a plain outline.
 */
export type ButtonVariant = "primary" | "action" | "secondary";
export type ButtonSize = "regular" | "small";

const fade = "enabled:hover:opacity-[0.92] enabled:active:opacity-[0.85]";
const inkFill = "bg-ink text-paper disabled:bg-line-heavy disabled:text-muted";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: cx(inkFill, fade),
  action: cx(inkFill, "hover:bg-red hover:text-on-red active:bg-red active:text-on-red"),
  secondary:
    "border-[1.5px] border-ink bg-card text-ink hover:bg-tint active:bg-tint disabled:border-line-heavy disabled:text-muted",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  regular: "min-h-[52px] px-5",
  small: "min-h-11 px-4",
};

/** Colour, opacity and press scale ease together; pair it with a `motion-safe:active:scale-*` class. */
export const pressTransitionClass =
  "transition-[color,background-color,border-color,opacity,transform] duration-[120ms] ease-out";

const pressableClass = cx(
  "relative inline-flex items-center justify-center disabled:cursor-not-allowed aria-busy:cursor-progress",
  pressTransitionClass,
  focusRingClass,
);

export function buttonClass({
  variant = "primary",
  size = "regular",
  fullWidth = false,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean } = {}): string {
  return cx(
    pressableClass,
    "gap-2 rounded-xl font-sans text-[15px] font-semibold no-underline motion-safe:active:scale-[0.98]",
    BUTTON_SIZE[size],
    BUTTON_VARIANT[variant],
    fullWidth && "w-full",
  );
}

/** Back is an outline, Next is filled; neither turns red, and a disabled one stays at 35%. */
export function circleButtonClass(direction: "back" | "next"): string {
  return cx(
    pressableClass,
    "size-14 shrink-0 rounded-full compact:size-11 disabled:opacity-35 motion-safe:active:scale-[0.96]",
    fade,
    direction === "next" ? "bg-ink text-paper" : "border-2 border-ink bg-transparent text-ink",
  );
}

export type EyebrowTone = "muted" | "accent" | "info";

const EYEBROW_TONE: Record<EyebrowTone, string> = {
  muted: "text-muted",
  accent: "text-red",
  info: "text-blue",
};

export function eyebrowClass(tone: EyebrowTone = "muted"): string {
  return cx(
    "block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]",
    EYEBROW_TONE[tone],
  );
}

export const iconChipClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-tint text-red";

export const navLinkClass =
  "inline-flex min-h-11 items-center font-sans text-[14px] font-medium text-muted no-underline transition-colors hover:text-ink";

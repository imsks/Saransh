"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { Icon, circleButtonClass, cx } from "@/components/ui";
import type { Story } from "@/constants/stories";

import StoryCard from "./StoryCard";

/** Motion */
const SWIPE_PX = 80;
const EDGE_PX = 24;
const FULL_RAISE_PX = 160;
const FLY_PX = -520;
const PARK_PX = -420;
const TILT = 22;
const SINK_PX = 14;
const SINK_SCALE = 0.94;
const SETTLE_MS = 260;

type Move = 1 | -1;

function Chevron({ direction }: { direction: "back" | "next" }) {
  return (
    <Icon size={22} strokeWidth={2.4}>
      <path d={direction === "back" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </Icon>
  );
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

const slide = (x: number) => `translateX(${x}px) rotate(${x / TILT}deg)`;
const raise = (p: number) =>
  `translateY(${SINK_PX * (1 - p)}px) scale(${SINK_SCALE + (1 - SINK_SCALE) * p})`;

/** Left drag (dx < 0) raises the next card; right drag swings the previous one in on top. */
function cardTransform(offset: number, dx: number): string {
  const p = Math.min(Math.abs(dx) / FULL_RAISE_PX, 1);
  if (offset < 0) return slide(offset === -1 && dx > 0 ? PARK_PX + dx : PARK_PX);
  if (offset === 0) return dx > 0 ? raise(1 - p) : slide(dx);
  return raise(offset === 1 && dx < 0 ? p : 0);
}

/** `title` sits left of the counter: the page's h1, or a plain label in a preview. */
export default function SwipeDeck({ stories, title }: { stories: Story[]; title: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  /** 0 is a spring back; null is at rest. */
  const [settling, setSettling] = useState<Move | 0 | null>(null);
  const drag = useRef<{ id: number; startX: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const last = stories.length - 1;
  const canMove = (move: Move) => (move === 1 ? index < last : index > 0);

  useEffect(() => {
    if (settling === null) return;
    const timer = setTimeout(() => {
      setIndex((i) => i + settling);
      setDx(0);
      setSettling(null);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [settling]);

  if (stories.length === 0) return null;

  const go = (move: Move) => {
    if (settling !== null || !canMove(move)) return;
    if (prefersReducedMotion()) {
      setIndex(index + move);
      return;
    }
    setDx(move === 1 ? FLY_PX : -PARK_PX);
    setSettling(move);
  };

  const springBack = () => {
    if (dx === 0) return;
    setDx(0);
    setSettling(0);
  };

  const release = (distance: number) => {
    const move: Move = distance < 0 ? 1 : -1;
    if (Math.abs(distance) >= SWIPE_PX && canMove(move)) go(move);
    else springBack();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (settling !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    const { left, right } = e.currentTarget.getBoundingClientRect();
    if (e.clientX - left < EDGE_PX || right - e.clientX < EDGE_PX) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, startX: e.clientX, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const distance = e.clientX - d.startX;
    if (Math.abs(distance) > 4) d.moved = true;
    if (prefersReducedMotion()) return;
    setDx(canMove(distance < 0 ? 1 : -1) ? distance : 0);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    suppressClick.current = d.moved;
    release(e.clientX - d.startX);
  };

  const onPointerCancel = () => {
    drag.current = null;
    springBack();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Stories"
      className="flex h-full w-full flex-col pb-[22px] compact:pb-2.5"
    >
      <div className="mb-4 shrink-0 compact:mb-2.5">
        <div className="flex items-baseline justify-between gap-3">
          {title}
          <span aria-live="polite" className="shrink-0 font-sans text-[13px] font-semibold text-muted">
            {index + 1} / {stories.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            data-progress=""
            className="h-full rounded-full bg-red transition-[width] duration-[240ms] ease-out motion-reduce:transition-none"
            style={{ width: `${((index + 1) / stories.length) * 100}%` }}
          />
        </div>
      </div>

      {/* The clip reaches 16px (the gutter) past the cards so their shadow is not cut.
          The card underneath scales from its centre, so it stays hidden behind the top card
          and the space below the card is a clean gap above the circles. */}
      <div className="relative -mx-4 min-h-0 flex-1 overflow-x-clip">
        {stories.map((story, i) => {
          const offset = i - index;
          const isTop = offset === 0;
          const style: CSSProperties = {
            transform: cardTransform(offset, dx),
            transition: settling !== null ? `transform ${SETTLE_MS}ms ease-out` : undefined,
            // A wide card parked at -420px still pokes in, so it shows only while swinging back.
            visibility: offset === 0 || offset === 1 || (offset === -1 && dx > 0) ? undefined : "hidden",
            zIndex: offset < 0 ? 3 : isTop ? 2 : 1,
          };
          return (
            <div
              key={story.id ?? i}
              aria-hidden={!isTop || undefined}
              // React 18 has no `inert` prop type; it passes the attribute through.
              {...(!isTop && ({ inert: "" } as object))}
              data-deck-card={offset}
              style={style}
              className={cx(
                "absolute inset-x-4 bottom-3.5 top-0 select-none compact:bottom-2.5",
                isTop ? "touch-pan-y" : "pointer-events-none",
              )}
              {...(isTop && {
                onPointerDown,
                onPointerMove,
                onPointerUp,
                onPointerCancel,
                // A drag that ends on the source link must not open it.
                onClickCapture: (e: MouseEvent) => {
                  if (!suppressClick.current) return;
                  suppressClick.current = false;
                  e.preventDefault();
                  e.stopPropagation();
                },
              })}
            >
              <StoryCard story={story} />
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous story"
          className={circleButtonClass("back")}
        >
          <Chevron direction="back" />
        </button>
        <span className="text-center font-sans text-[13px] text-muted">Swipe for the next story</span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === last}
          aria-label="Next story"
          className={circleButtonClass("next")}
        >
          <Chevron direction="next" />
        </button>
      </div>
    </section>
  );
}

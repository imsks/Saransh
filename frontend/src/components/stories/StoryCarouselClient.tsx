"use client";
import { useEffect, useRef, useState } from "react";
import StoryCard from "./StoryCard";
import type { Story } from "@/constants/stories";
import { analytics } from "@/lib/analytics";

interface StoryCarouselClientProps {
  stories: Story[];
  /** True when the cards are the local samples, not live stories from the API. */
  isSample?: boolean;
}

/** Design system: a drag shorter than this is not a swipe. */
const SWIPE_THRESHOLD_PX = 80;
const AUTO_ADVANCE_MS = 3_000;

const circleClass =
  "inline-flex size-14 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:cursor-not-allowed disabled:opacity-35";

function Chevron({ direction }: { direction: "back" | "next" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "back" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/**
 * The landing-page preview of the app's story screen: one card with Back and
 * Next. It advances automatically and also supports manual navigation.
 */
export default function StoryCarouselClient({
  stories,
  isSample = false,
}: StoryCarouselClientProps) {
  const [index, setIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left",
  );
  const touchStartRef = useRef<number | null>(null);
  const last = stories.length - 1;
  const current = Math.min(index, last);

  useEffect(() => {
    setIndex(0);
  }, [stories]);

  useEffect(() => {
    if (stories.length < 2) return;

    const timeout = window.setTimeout(() => {
      setSlideDirection("left");
      setIndex((currentIndex) => (currentIndex + 1) % stories.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timeout);
  }, [current, stories.length]);

  if (stories.length === 0) return null;

  /**
   * A move the reader made. Only one that actually moved the card is reported;
   * the auto-advance above never is.
   */
  const move = (direction: "next" | "back", method: "button" | "swipe") => {
    const target = direction === "next" ? Math.min(last, current + 1) : Math.max(0, current - 1);
    if (target === current) return;
    setSlideDirection(direction === "next" ? "left" : "right");
    setIndex(target);
    analytics.capture("story_carousel_advanced", {
      direction,
      method,
      position: target + 1,
      total: stories.length,
      sample: isSample,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const delta = touchStartRef.current - e.changedTouches[0].clientX;
    if (delta > SWIPE_THRESHOLD_PX) move("next", "swipe");
    else if (delta < -SWIPE_THRESHOLD_PX) move("back", "swipe");
    touchStartRef.current = null;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Story preview"
      className="mx-auto w-full max-w-[496px]"
    >
      <div className="mb-3 flex items-baseline justify-between">
        {/* Samples say so. Live stories carry no label at all. */}
        {isSample && (
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
            Sample story
          </span>
        )}
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden rounded-[24px]"
      >
        <div
          key={current}
          aria-live="polite"
          className={
            slideDirection === "left"
              ? "animate-story-slide-left"
              : "animate-story-slide-right"
          }
        >
          <StoryCard story={stories[current]} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move("back", "button")}
          disabled={current === 0}
          aria-label="Previous story"
          className={`${circleClass} border-2 border-ink bg-transparent text-ink`}
        >
          <Chevron direction="back" />
        </button>
        <span className="font-sans text-[13px] font-semibold text-muted">
          {current + 1} / {stories.length}
        </span>
        <button
          type="button"
          onClick={() => move("next", "button")}
          disabled={current === last}
          aria-label="Next story"
          className={`${circleClass} border-2 border-ink bg-ink text-paper`}
        >
          <Chevron direction="next" />
        </button>
      </div>
    </section>
  );
}

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
 * Next. It moves only when the reader asks it to.
 */
export default function StoryCarouselClient({
  stories,
  isSample = false,
}: StoryCarouselClientProps) {
  const [index, setIndex] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [stories]);

  if (stories.length === 0) return null;

  const last = stories.length - 1;
  const current = Math.min(index, last);

  /** Only a move the reader made, that actually moved the card, is reported. */
  const move = (direction: "next" | "back", method: "button" | "swipe") => {
    const target = direction === "next" ? Math.min(last, current + 1) : Math.max(0, current - 1);
    if (target === current) return;
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
        {isSample ? (
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
            Sample story
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="font-sans text-[13px] font-semibold text-muted">
          {current + 1} / {stories.length}
        </span>
      </div>
      <div
        key={current}
        aria-live="polite"
        className="animate-card-in"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <StoryCard story={stories[current]} />
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

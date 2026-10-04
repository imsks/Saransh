"use client";
import { useEffect, useRef, useState } from "react";
import StoryCard from "./StoryCard";
import type { Story } from "@/constants/stories";

interface StoryCarouselClientProps {
  stories: Story[];
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
 * The landing-page preview of the app's story screen: progress strip, one card,
 * Back and Next. It moves only when the reader asks it to.
 */
export default function StoryCarouselClient({ stories }: StoryCarouselClientProps) {
  const [index, setIndex] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [stories]);

  if (stories.length === 0) return null;

  const last = stories.length - 1;
  const current = Math.min(index, last);
  const goBack = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(last, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const delta = touchStartRef.current - e.changedTouches[0].clientX;
    if (delta > SWIPE_THRESHOLD_PX) goNext();
    else if (delta < -SWIPE_THRESHOLD_PX) goBack();
    touchStartRef.current = null;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Story preview"
      className="mx-auto w-full max-w-[358px] min-[860px]:mx-0"
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
          LIVE FEED PREVIEW
        </span>
        <span className="font-sans text-[13px] font-semibold text-muted">
          {current + 1} / {stories.length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Stories read"
        aria-valuemin={1}
        aria-valuemax={stories.length}
        aria-valuenow={current + 1}
        className="mb-4 h-1.5 overflow-hidden rounded-[3px] bg-line-heavy"
      >
        <div
          className="h-full rounded-[3px] bg-red transition-[width] duration-200"
          style={{ width: `${((current + 1) / stories.length) * 100}%` }}
        />
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
          onClick={goBack}
          disabled={current === 0}
          aria-label="Previous story"
          className={`${circleClass} border-2 border-ink bg-transparent text-ink`}
        >
          <Chevron direction="back" />
        </button>
        <button
          type="button"
          onClick={goNext}
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

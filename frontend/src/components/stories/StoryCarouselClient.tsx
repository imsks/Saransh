"use client";
import { useState, useEffect, useRef } from "react";
import StoryCard from "./StoryCard";
import type { Story } from "@/constants/stories";

interface StoryCarouselClientProps {
  stories: Story[];
}

const ADVANCE_MS = 4200;

export default function StoryCarouselClient({ stories }: StoryCarouselClientProps) {
  const [index, setIndex] = useState(0);
  const touchStartRef = useRef<number | null>(null);
  // Bumped on every card change so the card remounts and replays its entrance.
  const [key, setKey] = useState(0);
  // Bumped when the reader picks a card, so the countdown to the next one restarts.
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const paused = reducedMotion || hovered || focused;

  const goTo = (i: number) => {
    setIndex(i);
    setKey((k) => k + 1);
    setTimerEpoch((t) => t + 1);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [stories]);

  useEffect(() => {
    if (paused || stories.length < 2) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % stories.length);
      setKey((k) => k + 1);
    }, ADVANCE_MS);

    return () => clearInterval(timer);
  }, [paused, stories.length, timerEpoch]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const delta = touchStartRef.current - e.changedTouches[0].clientX;
    if (delta > 40) goTo((index + 1) % stories.length);
    else if (delta < -40) goTo((index - 1 + stories.length) % stories.length);
    touchStartRef.current = null;
  };

  if (stories.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
          LIVE FEED PREVIEW
        </span>
        {/* Negative margins keep the row as tall as the label while each dot stays a 44px-tall target. */}
        <div className="-my-[18px] -mr-[10px] flex items-center">
          {stories.map((_, i) => (
            <button
              key={i}
              type="button"
              className="flex h-11 w-7 cursor-pointer items-center justify-center border-none bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red"
              onClick={() => goTo(i)}
              aria-label={`Story ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
            >
              <span
                className={`h-[7px] w-[7px] rounded-full ${i === index ? "bg-ink" : "bg-muted"}`}
              />
            </button>
          ))}
        </div>
      </div>
      <div
        key={key}
        className="rounded-[2px] border-[1.5px] border-ink bg-card px-[22px] pb-[18px] pt-5 shadow-print animate-card-in dark:border-line"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <StoryCard story={stories[index]} />
      </div>
    </div>
  );
}

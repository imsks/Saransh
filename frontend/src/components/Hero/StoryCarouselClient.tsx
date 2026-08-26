"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import StoryCard from "./StoryCard";
import type { Story } from "@/constants/stories";

interface StoryCarouselClientProps {
  stories: Story[];
  isLive?: boolean;
}

export default function StoryCarouselClient({
  stories,
  isLive = false,
}: StoryCarouselClientProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const [key, setKey] = useState(0);

  const goTo = useCallback(
    (i: number) => {
      setIndex(i);
      setKey((k) => k + 1);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % stories.length);
        setKey((k) => k + 1);
      }, 4200);
    },
    [stories.length],
  );

  useEffect(() => {
    setIndex(0);
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % stories.length);
      setKey((k) => k + 1);
    }, 4200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stories]);

  const prev = () => goTo((index - 1 + stories.length) % stories.length);
  const next = () => goTo((index + 1) % stories.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const delta = touchStartRef.current - e.changedTouches[0].clientX;
    if (delta > 40) next();
    else if (delta < -40) prev();
    touchStartRef.current = null;
  };

  if (stories.length === 0) return null;

  return (
    <div className="sticky top-20 max-[860px]:static">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
          {isLive ? "Live feed" : "Live feed preview"}
        </span>
        <div className="flex items-center gap-1.5">
          {stories.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 w-1.5 cursor-pointer rounded-full border-none p-0 transition-colors ${
                i === index ? "bg-ink" : "bg-line-heavy"
              }`}
              onClick={() => goTo(i)}
              aria-label={`Story ${i + 1}`}
            />
          ))}
        </div>
      </div>
      <div
        key={key}
        className="animate-card-in rounded-sm border-[1.5px] border-ink bg-card px-[22px] pb-[18px] pt-5 shadow-[4px_4px_0_rgba(15,20,25,0.07)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <StoryCard story={stories[index]} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-heavy bg-card text-xs transition-colors hover:border-ink"
          onClick={prev}
          aria-label="Previous story"
        >
          ←
        </button>
        <span className="flex-1 text-center font-mono text-[10px] text-muted">
          Swipe through stories — takes under 5 minutes
        </span>
        <button
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-heavy bg-card text-xs transition-colors hover:border-ink"
          onClick={next}
          aria-label="Next story"
        >
          →
        </button>
      </div>
    </div>
  );
}

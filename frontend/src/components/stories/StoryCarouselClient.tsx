"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import StoryCard from "./StoryCard";
import type { Story } from "@/constants/stories";

interface StoryCarouselClientProps {
  stories: Story[];
}

export default function StoryCarouselClient({ stories }: StoryCarouselClientProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const [key, setKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      setIndex(i);
      setKey((k) => k + 1);
      if (timerRef.current) clearInterval(timerRef.current);
      if (!reducedMotion) {
        timerRef.current = setInterval(() => {
          setIndex((prev) => (prev + 1) % stories.length);
          setKey((k) => k + 1);
        }, 4200);
      }
    },
    [reducedMotion, stories.length],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    setIndex(0);
    if (!reducedMotion) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % stories.length);
        setKey((k) => k + 1);
      }, 4200);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reducedMotion, stories]);

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
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted">
          LIVE FEED PREVIEW
        </span>
        <div className="flex items-center gap-1.5">
          {stories.map((_, i) => (
            <button
              key={i}
              className={`h-[7px] w-[7px] cursor-pointer rounded-full border-none p-0 ${
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
        className="rounded-[2px] border-[1.5px] border-ink bg-card px-[22px] pb-[18px] pt-5 shadow-[4px_4px_0_rgba(15,20,25,0.07)] animate-card-in"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <StoryCard story={stories[index]} />
      </div>
    </div>
  );
}

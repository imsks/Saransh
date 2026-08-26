"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/styles/StoryCarousel.module.css";
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
    <div className={styles.container}>
      <div className={styles.topRow}>
        <span className={styles.feedLabel}>
          {isLive ? "Live feed" : "Live feed preview"}
        </span>
        <div className={styles.dots}>
          {stories.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Story ${i + 1}`}
            />
          ))}
        </div>
      </div>
      <div
        key={key}
        className={styles.card}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <StoryCard story={stories[index]} />
      </div>
      <div className={styles.bottomRow}>
        <button className={styles.navBtn} onClick={prev} aria-label="Previous story">
          ←
        </button>
        <span className={styles.hintText}>Swipe through stories — takes under 5 minutes</span>
        <button className={styles.navBtn} onClick={next} aria-label="Next story">
          →
        </button>
      </div>
    </div>
  );
}

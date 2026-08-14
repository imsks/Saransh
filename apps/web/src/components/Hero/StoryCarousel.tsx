"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/styles/StoryCarousel.module.css";
import StoryCard from "./StoryCard";
import { STORIES } from "@/constants/stories";

export default function StoryCarousel() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const [key, setKey] = useState(0);

  const goTo = useCallback((i: number) => {
    setIndex(i);
    setKey(k => k + 1);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex(prev => (prev + 1) % STORIES.length);
      setKey(k => k + 1);
    }, 4200);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex(prev => (prev + 1) % STORIES.length);
      setKey(k => k + 1);
    }, 4200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const prev = () => goTo((index - 1 + STORIES.length) % STORIES.length);
  const next = () => goTo((index + 1) % STORIES.length);

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

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <span className={styles.feedLabel}>Live feed preview</span>
        <div className={styles.dots}>
          {STORIES.map((_, i) => (
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
        <StoryCard story={STORIES[index]} />
      </div>
      <div className={styles.bottomRow}>
        <button className={styles.navBtn} onClick={prev} aria-label="Previous story">←</button>
        <span className={styles.hintText}>Swipe through stories — takes under 5 minutes</span>
        <button className={styles.navBtn} onClick={next} aria-label="Next story">→</button>
      </div>
    </div>
  );
}

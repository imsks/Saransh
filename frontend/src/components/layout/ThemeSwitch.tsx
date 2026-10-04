"use client";

import { useEffect, useState } from "react";

import { ThemeToggle } from "@sutra_ui/ui";

const boxClass = "size-8 rounded-[2px] border border-line";

/**
 * Sutra's ThemeToggle picks its icon from the reader's stored theme, which the
 * server cannot know, so rendering it during SSR breaks hydration for anyone
 * whose theme differs from the server's guess. It is mounted on the client
 * only; a same-sized box holds its place so the nav does not shift.
 */
export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span aria-hidden="true" className={`inline-block ${boxClass}`} />;
  }

  return (
    <ThemeToggle
      className={`relative ${boxClass} bg-transparent text-muted after:absolute after:-inset-1.5 after:content-[''] hover:bg-card hover:text-ink`}
    />
  );
}

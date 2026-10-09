"use client";
import { useEffect, useRef } from "react";

import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/buttonClasses";

export default function ThankYou() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // The overlay covers the page, so keyboard and screen-reader focus must follow it.
    headingRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[200] flex flex-col items-center justify-center bg-paper p-8"
      role="status"
      aria-live="polite"
    >
      <div className="animate-pop-in mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green text-card">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-4 text-center font-serif text-[clamp(28px,4vw,42px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink focus:outline-none"
      >
        You&apos;re on the list.
        <br />
        <em className="font-medium italic text-green">We&apos;ll be in touch.</em>
      </h2>
      <p className="mb-7 max-w-[42ch] text-center font-sans text-[15.5px] leading-[1.72] text-muted">
        We&apos;ll email you once when Saransh launches. That&apos;s all you&apos;ll hear from us.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="https://github.com/imsks/Saransh"
          target="_blank"
          rel="noopener noreferrer"
          className={primaryButtonClass}
        >
          FOLLOW THE BUILD ON GITHUB
        </a>
        <a
          href="https://rajniti-app.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButtonClass}
        >
          EXPLORE RAJNITI
        </a>
      </div>
      <p className="absolute inset-x-0 bottom-6 px-5 text-center font-mono text-[10px] text-muted">
        Saransh{" "}
        <span lang="hi" className="font-hindi">
          सारांश
        </span>{" "}
        —{" "}
        <span lang="hi" className="font-hindi">
          शोर नहीं। सिर्फ़ खबर। सबूत के साथ।
        </span>
      </p>
    </div>
  );
}

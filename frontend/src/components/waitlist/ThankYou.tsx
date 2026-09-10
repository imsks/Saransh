"use client";
import { useEffect } from "react";

export default function ThankYou({ language }: { language: string }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
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
      <div className="animate-pop-in mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="mb-4 text-center font-serif text-[clamp(28px,4vw,42px)] font-semibold leading-[1.1] tracking-tight text-ink">
        You&apos;re on the list.
        <br />
        <span className="italic text-green">We&apos;ll be in touch.</span>
      </h2>
      <p className="mb-3 max-w-[42ch] text-center font-sans text-[15.5px] leading-[1.72] text-muted">
        We&apos;ll reach out when Saransh is ready for your region. No spam — one email when we launch.
      </p>
      <p className="mb-7 font-mono text-[10.5px] uppercase tracking-wide text-muted">
        We&apos;ll contact you in <span className="font-semibold text-ink">{language}</span>.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="https://github.com/imsks/Saransh"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm bg-ink px-[18px] py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-card no-underline transition-colors hover:bg-red"
        >
          Follow the build on GitHub ↗
        </a>
        <a
          href="https://rajniti-app.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border-[1.5px] border-line-heavy px-[18px] py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted no-underline transition-[border-color,color] hover:border-ink hover:text-ink"
        >
          Explore Rajniti ↗
        </a>
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-line-heavy">
        Saransh सारांश — आपके ज़िले की खबर, 60 शब्दों में, सबूत के साथ।
      </p>
    </div>
  );
}

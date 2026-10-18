"use client";

import { primaryButtonClass } from "@/components/ui/buttonClasses";

export default function BottomCTA() {
  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <section className="border-t border-line py-20 text-center">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <h2 className="mb-[14px] font-serif text-[clamp(26px,3.5vw,42px)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink">
          News you can <em className="font-medium italic text-red">verify</em>{" "}
          in under five minutes.
        </h2>
        <p className="mx-auto mb-3 max-w-[53ch] font-sans text-[15.5px] leading-[1.72] text-muted">
          Saransh is for people who want the story, not the take. Every summary
          is attributed, and will be approved by a person before it goes live.
          We are building the review step now.
        </p>
        <p className="mx-auto mb-7 max-w-[50ch] font-sans text-[15.5px] leading-[1.72] text-muted">
          Sign up to hear when it&apos;s ready.
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          className={primaryButtonClass}
        >
          JOIN THE WAITLIST
        </button>
      </div>
    </section>
  );
}

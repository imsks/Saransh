"use client";

export default function BottomCTA() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <section className="border-t border-line py-[88px] text-center">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <h2 className="mb-[14px] font-serif text-[clamp(26px,4.4vw,44px)] font-semibold leading-[1.1] tracking-[-0.025em] text-ink">
          News you can <em className="font-medium italic text-red">verify</em> in under five minutes.
        </h2>
        <p className="mx-auto mb-7 max-w-[44ch] font-sans text-[15.5px] leading-[1.7] text-muted">
          Saransh is for people who want the story, not the take. Every summary is attributed and
          reviewed by a person before it goes live. Sign up to hear when it&apos;s ready.
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-block rounded-[2px] bg-ink px-9 py-[14px] font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-card hover:bg-red"
        >
          JOIN THE WAITLIST
        </button>
      </div>
    </section>
  );
}

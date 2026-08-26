export default function BottomCTA() {
  return (
    <section className="border-t border-line py-20 text-center">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <h2 className="mb-4 font-serif text-[clamp(26px,3.5vw,42px)] font-semibold leading-[1.1] tracking-tight text-ink">
          News you can <span className="font-medium italic text-red">verify</span> in under five
          minutes.
        </h2>
        <p className="mx-auto mb-7 max-w-[46ch] font-sans text-[15.5px] leading-[1.72] text-muted">
          Verified sources. Human-reviewed summaries. No algorithm. No opinion. Be the first to know
          when Saransh is ready.
        </p>
        <a
          href="#waitlist"
          className="inline-block rounded-sm bg-ink px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-card no-underline transition-colors hover:bg-red"
        >
          Join the waitlist ↗
        </a>
      </div>
    </section>
  );
}

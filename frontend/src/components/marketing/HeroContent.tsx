export default function HeroContent() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-[clamp(36px,5.2vw,58px)] font-semibold leading-[1.05] tracking-[-0.028em] text-ink">
        India&apos;s news.
        <br />
        Sourced, summarised,
        <br />
        <em className="font-medium italic text-red">accountable.</em>
      </h1>
      <p className="max-w-[48ch] border-l-2 border-red pl-4 font-sans text-base leading-[1.72] text-muted">
        You follow national news, but local stories don&apos;t travel the same way. Saransh pulls from
        verified sources and gives you a concise, attributed summary of what actually happened in your
        district. Every claim traces back to an official source you can check.
      </p>
    </div>
  );
}

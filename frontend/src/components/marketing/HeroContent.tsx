export default function HeroContent() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-[clamp(34px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink">
        India&apos;s news.
        <br />
        Sourced, summarised,
        <br />
        <em className="font-medium italic text-red">accountable.</em>
      </h1>
      <p className="max-w-[44ch] border-l-2 border-red pl-4 font-sans text-[17px] leading-[1.68] text-muted">
        Whether you are tracking national headlines or regional updates, Saransh
        filters out the sensationalism, pulling directly from verified
        publishers to give you a concise, attributed summary of what actually
        happened. Every single claim traces back to a trusted, official source
        you can verify yourself.
      </p>
    </div>
  );
}

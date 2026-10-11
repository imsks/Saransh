export default function HeroContent() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-[clamp(34px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink">
        India&apos;s news.
        <br />
        Sourced,
        <br />
        summarised,
        <br />
        <span className="italic text-red">accountable.</span>
      </h1>
      <p className="max-w-[44ch] border-l-2 border-red pl-4 font-sans leading-[1.68] text-muted">
        Whether you are tracking national headlines or regional updates, Saransh
        filters out the sensationalism, pulling directly from verified
        publishers to give you a concise, attributed summary of what actually
        happened.
      </p>
    </div>
  );
}

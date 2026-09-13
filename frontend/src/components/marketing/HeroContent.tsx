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
      <p className="max-w-[44ch] border-l-2 border-red pl-4 font-sans text-base leading-[1.72] text-muted">
        Whether you are tracking national headlines or regional updates, Saransh
        filters out the sensationalism, pulling directly from verified
        publishers to give you a concise, attributed summary of what actually
        happened. Every single claim traces back to a trusted, official source
        you can verify yourself.
      </p>
    </div>
  );
}

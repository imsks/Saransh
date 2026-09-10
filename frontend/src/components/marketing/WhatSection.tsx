function DocIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="14" height="18" rx="1" />
      <line x1="8" y1="7" x2="14" y2="7" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="8" y1="15" x2="11" y2="15" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red"
      aria-hidden="true"
    >
      <polyline points="8 6 2 11 8 16" />
      <polyline points="14 6 20 11 14 16" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red"
      aria-hidden="true"
    >
      <circle cx="11" cy="7" r="4" />
      <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function WhatSection() {
  return (
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <span className="mb-3.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
              What Saransh is
            </span>
            <h2 className="mb-6 font-serif text-[clamp(26px,3vw,36px)] font-semibold leading-[1.12] tracking-tight text-ink">
              A structured feed of things that{" "}
              <span className="font-medium italic text-muted">actually happened,</span> attributed to
              the people who said them.
            </h2>
            <p className="mb-4 font-sans text-[15.5px] leading-[1.72] text-muted">
              Every story in Saransh starts with a source — a government press release, an official
              police bulletin, an administrative order, a registered news outlet. Our pipeline fetches
              these, strips the copy to its factual core, and writes a summary that attributes every
              claim:{" "}
              <strong>
                &apos;According to the district magistrate… the PWD stated… police confirmed…&apos;
              </strong>
            </p>
            <p className="mb-4 font-sans text-[15.5px] leading-[1.72] text-muted">
              There are no columnists, no unnamed sources, no &apos;experts say.&apos; If a claim cannot
              be attributed to a named institution or official, it doesn&apos;t appear in the feed.{" "}
              <strong>You can tap through to the original source on every single card.</strong>
            </p>
            <p className="mb-4 font-sans text-[15.5px] leading-[1.72] text-muted">
              The short format is a constraint, not a gimmick. A story that cannot be summarised
              accurately within it is not ready to publish — the pipeline rejects it and queues it for a
              human editor. Every story you read has been reviewed by a person before it went live.
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="border-[1.5px] border-ink bg-card px-[22px] pb-5 pt-[22px]">
              <div className="mb-2.5 flex items-center gap-2.5">
                <DocIcon />
                <h3 className="font-serif text-lg font-semibold leading-tight tracking-tight text-ink">
                  Verified sources only
                </h3>
              </div>
              <p className="mb-2.5 font-sans text-[13.5px] leading-[1.6] text-muted">
                We ingest from official government portals, PIB, state information departments,
                registered news outlets, and court order databases.{" "}
                <strong>No social media. No anonymous forwards.</strong> Every source in the registry is
                public.
              </p>
              <a
                href="https://github.com/imsks/Saransh"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] font-semibold uppercase text-blue no-underline"
              >
                View source registry ↗
              </a>
            </div>
            <div className="border-[1.5px] border-ink bg-card px-[22px] pb-5 pt-[22px]">
              <div className="mb-2.5 flex items-center gap-2.5">
                <CodeIcon />
                <h3 className="font-serif text-lg font-semibold leading-tight tracking-tight text-ink">
                  Open-source pipeline
                </h3>
              </div>
              <p className="mb-2.5 font-sans text-[13.5px] leading-[1.6] text-muted">
                The summarisation prompts, ranking logic, and deduplication rules are all public on
                GitHub. <strong>No hidden editorial layer.</strong> If a prompt introduces bias, open
                an issue — we&apos;ll show our work or fix it.
              </p>
              <a
                href="https://github.com/imsks/Saransh"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] font-semibold uppercase text-blue no-underline"
              >
                Read the prompts ↗
              </a>
            </div>
            <div className="border-[1.5px] border-ink bg-card px-[22px] pb-5 pt-[22px]">
              <div className="mb-2.5 flex items-center gap-2.5">
                <PersonIcon />
                <h3 className="font-serif text-lg font-semibold leading-tight tracking-tight text-ink">
                  Human review before publish
                </h3>
              </div>
              <p className="mb-2.5 font-sans text-[13.5px] leading-[1.6] text-muted">
                Every AI-drafted story passes a human editor before going live. The reviewer can
                approve, edit, or kill. <strong>The editing record is logged</strong> — model used,
                prompt version, reviewer action, timestamp. Corrections are public.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

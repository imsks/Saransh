import StoryCarousel from "@/components/stories/StoryCarousel";

function DocIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-red"
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
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-red"
      aria-hidden="true"
    >
      <polyline points="8 6 2 11 8 16" />
      <polyline points="14 6 20 11 14 16" />
      <line x1="12.7" y1="6" x2="9.3" y2="16" />
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
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-red"
      aria-hidden="true"
    >
      <circle cx="11" cy="7" r="3.2"/>
      <path d="M4 19c0-3.5 3.2-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export default function WhatSection() {
  return (
    <section className="border-t border-line py-16">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <div className="grid grid-cols-1 gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-[72px]">
          <StoryCarousel />

          <div>
            <div className="flex items-start gap-3.5 pb-5 pt-0 pl-[18px]">
              <DocIcon />
              <div>
                <h3 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                  VERIFIED SOURCES
                </h3>
                <p className="font-sans text-[13px] leading-[1.6] text-muted">
                  Government portals, PIB, registered outlets. Nothing unattributed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 border-t border-line px-0 py-5 pl-[18px]">
              <CodeIcon />
              <div>
                <h3 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                  OPEN-SOURCE PIPELINE
                </h3>
                <p className="font-sans text-[13px] leading-[1.6] text-muted">
                  Prompts, ranking logic, deduplication rules — all public on GitHub.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 border-t border-line px-0 py-5 pl-[18px]">
              <PersonIcon />
              <div>
                <h3 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                  HUMAN REVIEWED
                </h3>
                <p className="font-sans text-[13px] leading-[1.6] text-muted">
                  Every AI-drafted story is reviewed by a person before it goes live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

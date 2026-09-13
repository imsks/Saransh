export default function RajnitiSection() {
  return (
    <section className="border-t border-line py-[88px]">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <div className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-[5fr_7fr] min-[860px]:gap-[72px]">
          <div>
            <span className="mb-3.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-blue">
              CIVIC ACCOUNTABILITY
            </span>
            <h2 className="mb-5 font-serif text-[clamp(24px,3vw,34px)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
              When a story mentions a politician&apos;s promise, we link it to their record.
            </h2>
            <p className="mb-6 max-w-[42ch] font-sans text-[15px] leading-[1.74] text-muted">
              Saransh runs alongside Rajniti, an open database tracking elected representatives and
              what they actually did. When a story mentions a government project or scheme, the feed
              links directly to the representative responsible. You see the original promise and the
              current status without leaving the story.
            </p>
            <a
              href="https://rajniti-app.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-blue font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-blue no-underline hover:opacity-70"
            >
              Explore Rajniti
            </a>
          </div>
          <div>
            <div className="rounded-t-[3px] border-[1.5px] border-blue bg-blue-tint px-[22px] py-5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-blue">
                  Rajniti · Your representative
                </span>
                <span className="border border-blue px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-blue opacity-75">
                  LINKED
                </span>
              </div>
              <p className="mb-2 font-serif text-[16px] font-semibold text-ink">MLA · Barabanki Sadar</p>
              <p className="mb-3 font-sans text-[13.5px] italic leading-[1.6] text-muted">
                Promise (2024): &quot;Deva Road widening complete by March 2026&quot; · Status:{" "}
                <span className="not-italic font-semibold text-amber">Delayed, 60% complete</span>
              </p>
              <a
                href="https://rajniti-app.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-blue font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-blue no-underline hover:opacity-70"
              >
                View profile on Rajniti
              </a>
            </div>
            <div className="rounded-b-[3px] border-[1.5px] border-t-0 border-blue bg-paper px-4 py-3 font-mono text-[10px] leading-[1.65] text-muted">
              This chip appears inline when a story mentions a project linked to a tracked
              representative. The connection is drawn from Rajniti&apos;s public dataset, not inferred
              by the model.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

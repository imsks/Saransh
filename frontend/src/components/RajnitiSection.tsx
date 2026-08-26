export default function RajnitiSection() {
  return (
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <span className="mb-3.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-blue">
              Civic accountability
            </span>
            <h2 className="mb-5 font-serif text-[clamp(24px,3vw,34px)] font-semibold leading-[1.15] tracking-tight text-ink">
              When a story mentions a politician&apos;s promise, we link it to their record.
            </h2>
            <p className="mb-4 font-sans text-[15.5px] leading-[1.72] text-muted">
              Saransh is built alongside <strong>Rajniti</strong> — an open database of elected
              representatives, their promises, and their tracked outcomes. When a story touches a
              government project or official announcement, it cross-links to the representative
              responsible.
            </p>
            <p className="mb-4 font-sans text-[15.5px] leading-[1.72] text-muted">
              You&apos;ll see, inline in the story card, what was promised, when, and what the current
              status is. One tap goes to their full public profile on Rajniti.
            </p>
            <a
              href="https://rajniti-app.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-blue no-underline"
            >
              Explore Rajniti ↗
            </a>
          </div>
          <div>
            <div className="rounded-sm border-[1.5px] border-blue bg-blue-tint px-5 py-[18px]">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-blue">
                  Rajniti · Your representative
                </span>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-blue">
                  Linked
                </span>
              </div>
              <p className="mb-2 font-sans text-[15px] font-bold text-ink">MLA · Barabanki Sadar</p>
              <p className="mb-3 font-sans text-[13px] leading-[1.55] text-muted">
                Promise (2024): &quot;Deva Road widening complete by March 2026&quot; · Status:{" "}
                <span className="font-semibold text-amber">Delayed</span>,{" "}
                <span className="font-semibold text-amber">60% complete</span>
              </p>
              <a
                href="https://rajniti-app.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10.5px] font-semibold text-blue no-underline"
              >
                View profile on Rajniti ↗
              </a>
            </div>
            <div className="mt-3.5 border-l-2 border-line-heavy bg-surface px-3.5 py-3 font-mono text-[10.5px] leading-[1.6] text-muted">
              This chip appears inline when a story mentions a project or scheme linked to a tracked
              representative. The connection is drawn from Rajniti&apos;s public dataset — not inferred
              by the model.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

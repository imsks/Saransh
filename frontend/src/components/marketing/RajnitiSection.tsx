export default function RajnitiSection() {
  return (
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-[1120px] px-8 max-[560px]:px-5">
        <div className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-[5fr_7fr] min-[860px]:gap-16">
          <div>
            <span className="mb-3.5 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-blue">
              PLANNED · V2
            </span>
            <h2 className="mb-5 font-serif text-[clamp(24px,3vw,34px)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
              Politician-wise news on Rajniti profiles.
            </h2>
            <p className="mb-6 max-w-[42ch] font-sans text-[15.5px] leading-[1.72] text-muted">
              Saransh runs alongside Rajniti, an open database of elected representatives. In V2 we
              plan to group Saransh stories by the politician they mention, so a Rajniti profile can
              show that person&apos;s news in one place. None of this is built yet; Rajniti itself is
              live and you can browse it today.
            </p>
            <a
              href="https://rajniti-app.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-blue font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-blue no-underline transition-opacity hover:opacity-70"
            >
              Explore Rajniti
            </a>
          </div>
          <div>
            <div className="rounded-t-[3px] border-[1.5px] border-blue bg-blue-tint px-[22px] py-5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-blue">
                  Rajniti · Profile
                </span>
                <span className="rounded-[3px] border border-blue px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.1em] text-blue">
                  Illustration
                </span>
              </div>
              <p className="mb-2 font-sans text-[16px] font-bold text-ink">
                MLA · Your constituency
              </p>
              <p className="mb-3 font-sans text-[13.5px] italic leading-[1.6] text-muted">
                Promise: &quot;Road widening complete within two years&quot; · Status:{" "}
                <span className="not-italic font-semibold text-amber">Delayed, 60% complete</span>
              </p>
              <a
                href="https://rajniti-app.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-blue font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-blue no-underline transition-opacity hover:opacity-70"
              >
                View profile on Rajniti
              </a>
            </div>
            <div className="rounded-b-[3px] border-[1.5px] border-t-0 border-blue bg-paper px-4 py-3 font-mono text-[10px] leading-[1.65] text-muted">
              This chip is illustrative. It shows how a Rajniti profile could carry Saransh stories
              about a representative once the link is built.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Section, SectionHeader, buttonClass, cardClass, cx } from "@/components/ui";
import { EXTERNAL } from "@/lib/routes";

export default function RajnitiSection() {
  return (
    <Section aria-labelledby="rajniti-title">
      <div className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-[5fr_7fr] min-[860px]:gap-16">
        <div>
          <SectionHeader
            id="rajniti-title"
            eyebrow="PLANNED · V2"
            eyebrowTone="info"
            title="Politician-wise news on Rajniti profiles."
            lead={
              <>
                Saransh runs alongside Rajniti, an open database of elected representatives. In V2
                we plan to group Saransh stories by the politician they mention, so a Rajniti
                profile can show that person&apos;s news in one place. None of this is built yet;
                Rajniti itself is live and you can browse it today.
              </>
            }
          />
          <a
            href={EXTERNAL.rajniti}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(buttonClass({ variant: "secondary" }), "mt-7")}
          >
            Explore Rajniti
          </a>
        </div>
        <div className={cx(cardClass({ variant: "info", padding: "none" }), "overflow-hidden")}>
          <div className="px-6 py-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-blue">
                Rajniti · Profile
              </span>
              <span className="rounded-full border border-blue px-2.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.1em] text-blue">
                Illustration
              </span>
            </div>
            <p className="mb-2 font-sans text-[16px] font-bold text-ink">
              MLA · Your constituency
            </p>
            <p className="mb-4 font-sans text-[13.5px] italic leading-[1.6] text-muted">
              Promise: &quot;Road widening complete within two years&quot; · Status:{" "}
              <span className="not-italic font-semibold text-amber">Delayed, 60% complete</span>
            </p>
            <a
              href={EXTERNAL.rajniti}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-blue font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-blue no-underline transition-opacity hover:opacity-70"
            >
              View profile on Rajniti
            </a>
          </div>
          <p className="border-t border-blue/25 bg-card/60 px-6 py-3.5 font-mono text-[10px] leading-[1.65] text-muted">
            This chip is illustrative. It shows how a Rajniti profile could carry Saransh stories
            about a representative once the link is built.
          </p>
        </div>
      </div>
    </Section>
  );
}

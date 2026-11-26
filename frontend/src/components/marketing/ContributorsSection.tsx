import { Avatar } from "@sutra_ui/ui";

import { ExternalLink, Section, SectionHeader, buttonClass, cardClass, cx, focusRingClass } from "@/components/ui";
import contributorsData from "@/data/contributors.json";
import { EXTERNAL } from "@/lib/routes";

/** `scripts/generate_contributors.py` refreshes `contributors.json` weekly. */
export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export default function ContributorsSection({
  contributors = contributorsData,
}: {
  contributors?: Contributor[];
}) {
  return (
    <Section id="contribute" aria-labelledby="contribute-title">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-7">
        <SectionHeader
          id="contribute-title"
          eyebrow="Open source"
          eyebrowTone="accent"
          title="Built in the open."
          lead="The code, prompts and source list are public on GitHub. Pick up an issue, suggest a source, or improve a prompt. These are the people who have shipped Saransh so far."
        />
        <div className="flex flex-wrap gap-3">
          <ExternalLink
            href={EXTERNAL.repo}
            className={buttonClass()}
          >
            Contribute on GitHub
          </ExternalLink>
          <ExternalLink
            href={EXTERNAL.issues}
            className={buttonClass({ variant: "secondary" })}
          >
            Browse issues
          </ExternalLink>
        </div>
      </div>

      {contributors.length > 0 ? (
        <ul
          aria-label="Contributors"
          className="mt-10 grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[860px]:grid-cols-4"
        >
          {contributors.map((contributor) => (
            <li key={contributor.login}>
              <ExternalLink
                href={contributor.html_url}
                className={cx(
                  cardClass({ padding: "none" }),
                  "flex items-center gap-3.5 p-4 no-underline transition-colors hover:border-line-heavy",
                  focusRingClass,
                )}
              >
                <Avatar src={contributor.avatar_url} name={contributor.login} alt="" size="lg" />
                <span className="min-w-0">
                  <span className="block truncate font-sans text-[14.5px] font-semibold text-ink">
                    @{contributor.login}
                  </span>
                  <span className="block font-sans text-[12px] text-muted">
                    {contributor.contributions}{" "}
                    {contributor.contributions === 1 ? "contribution" : "contributions"}
                  </span>
                </span>
              </ExternalLink>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

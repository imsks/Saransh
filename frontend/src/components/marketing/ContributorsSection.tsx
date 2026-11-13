import { Avatar } from "@sutra_ui/ui";

import { Section, SectionHeader, buttonClass, cardClass, cx } from "@/components/ui";
import contributorsData from "@/data/contributors.json";
import { EXTERNAL } from "@/lib/routes";

/** One entry of `contributors.json`, which `scripts/generate_contributors.py` refreshes weekly. */
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
          <a
            href={EXTERNAL.repo}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass()}
          >
            Contribute on GitHub
          </a>
          <a
            href={EXTERNAL.issues}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "secondary" })}
          >
            Browse issues
          </a>
        </div>
      </div>

      {contributors.length > 0 ? (
        <ul
          aria-label="Contributors"
          className="mt-10 grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[860px]:grid-cols-4"
        >
          {contributors.map((contributor) => (
            <li key={contributor.login}>
              <a
                href={contributor.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cx(
                  cardClass({ padding: "none" }),
                  "flex items-center gap-3.5 p-4 no-underline transition-colors hover:border-line-heavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red",
                )}
              >
                <Avatar src={contributor.avatar_url} name={contributor.login} alt="" size="lg" />
                <span className="min-w-0">
                  <span className="block truncate font-sans text-[14.5px] font-semibold text-ink">
                    @{contributor.login}
                  </span>
                  <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
                    {contributor.contributions}{" "}
                    {contributor.contributions === 1 ? "contribution" : "contributions"}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

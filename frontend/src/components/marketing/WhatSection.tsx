import type { ReactNode } from "react";

import StoryCarouselClient from "@/components/stories/StoryCarouselClient";
import { Section, SectionHeader, cardClass, cx, iconChipClass } from "@/components/ui";
import { STORIES } from "@/constants/stories";

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const FEATURES: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "SOURCED, WITH A LINK",
    body: "Government portals, PIB, registered outlets. Every story names and links its source.",
    icon: (
      <>
        <rect x="4" y="2" width="14" height="18" rx="1" />
        <line x1="8" y1="7" x2="14" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
        <line x1="8" y1="15" x2="11" y2="15" />
      </>
    ),
  },
  {
    title: "OPEN SOURCE",
    body: "Prompts, source list and deduplication rules — public on GitHub as they are written.",
    icon: (
      <>
        <polyline points="8 6 2 11 8 16" />
        <polyline points="14 6 20 11 14 16" />
        <line x1="12.7" y1="6" x2="9.3" y2="16" />
      </>
    ),
  },
  {
    title: "HUMAN REVIEW: BEING BUILT",
    body: "Every AI-drafted story will be approved by a person before it goes live. We are building the review step now.",
    icon: (
      <>
        <circle cx="11" cy="7" r="3.2" />
        <path d="M4 19c0-3.5 3.2-6 7-6s7 2.5 7 6" />
      </>
    ),
  },
];

export default function WhatSection() {
  return (
    <Section id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="grid grid-cols-1 items-start gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-16">
        <StoryCarouselClient stories={STORIES} />

        <div className="flex flex-col gap-8">
          <SectionHeader
            id="how-it-works-title"
            eyebrow="How it works"
            eyebrowTone="accent"
            title="One story per card, with its source attached."
            lead="A preview of the story card Saransh is building. The three stories here are illustrative, not live news."
          />
          <ul className="flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className={cx(cardClass({ padding: "none" }), "flex items-start gap-4 p-5")}
              >
                <span className={iconChipClass}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                </span>
                <div>
                  <h3 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-[13.5px] leading-[1.6] text-muted">{feature.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

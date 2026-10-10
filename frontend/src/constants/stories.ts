/** The seven topics of design system v1.3. Colours the topic label and the illustration wash. */
export type Topic =
  | "politics"
  | "civic"
  | "education"
  | "crime"
  | "business"
  | "entertainment"
  | "sports";

export interface Story {
  category: string;
  time: string;
  topic: Topic;
  /** Real cover photo. When absent, the topic's illustration wash is shown instead. */
  imageUrl?: string;
  credit: string;
  headline: string;
  body: string;
  source: string;
  /** True only for a government or ministry source. Shows the green tick. */
  official?: boolean;
  /** Citation link — the article the summary was written from. Absent on older stories. */
  sourceUrl?: string;
}

/**
 * Illustrative cards for the landing page: one National, one State and one
 * India-relevant International. They stand in for a story, they do not report
 * one, so they are always shown under a "Sample story" label.
 */
export const STORIES: Story[] = [
  {
    category: "National",
    time: "Sample",
    topic: "politics",
    credit: "Illustration · Saransh",
    headline: "A ministry announces a national scheme",
    body: "This is a sample card. When a ministry announces a scheme, Saransh gives you what changed, who it covers and when it starts — and nothing else. The green tick means the summary came from the ministry itself.",
    source: "Ministry statement · Official",
    official: true,
  },
  {
    category: "State",
    time: "Sample",
    topic: "civic",
    credit: "Illustration · Saransh",
    headline: "A state clears a public transport plan",
    body: "This is a sample card. When a state clears civic work, Saransh carries the scope, the cost and the deadline, then the source it was written from. No adjectives, no panel shouting, no guess about what happens next.",
    source: "Saransh · Sample",
  },
  {
    category: "International",
    time: "Sample",
    topic: "business",
    credit: "Illustration · Saransh",
    headline: "A trade decision abroad reaches Indian exporters",
    body: "This is a sample card. When a decision abroad touches Indian exporters, students or travellers, Saransh explains only the part that reaches India, with the source attached and the speculation left out.",
    source: "Saransh · Sample",
  },
];

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
    topic: "politics",
    credit: "Illustration · Saransh",
    headline: "A ministry announces a national scheme",
    body: "When a ministry announces a scheme, Saransh explains who qualifies, which benefits are included, when applications open, and what changes for people already receiving support. It separates confirmed details from questions the ministry has not answered yet, so readers can see what to do next and what remains unclear. The green tick marks a summary checked against the ministry's own statement.",
    source: "Ministry statement · Official",
    official: true,
  },
  {
    category: "State",
    topic: "civic",
    credit: "Illustration · Saransh",
    headline: "A state clears a public transport plan",
    body: "When a state clears a public transport plan, Saransh lays out the routes included, the approved cost, and the agency responsible for delivery. It highlights the project timeline, planned service changes, and any decisions that still need public or budget approval. Readers get the practical details first, with the source attached and no prediction about whether the plan will meet its deadlines.",
    source: "Saransh · Sample",
  },
  {
    category: "International",
    topic: "business",
    credit: "Illustration · Saransh",
    headline: "A trade decision abroad reaches Indian exporters",
    body: "When a decision abroad affects Indian exporters, students, or travellers, Saransh explains the specific rule or change and who it reaches. The summary gives the effective date, any stated transition period, and the next step people may need to take. It separates confirmed effects on India from wider speculation, and links the underlying source so readers can check the original announcement themselves.",
    source: "Saransh · Sample",
  },
];

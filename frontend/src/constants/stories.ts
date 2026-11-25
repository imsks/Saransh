/** The seven topics of design system v1.3. Colours the Topic label only. */
export type Topic =
  | "politics"
  | "civic"
  | "education"
  | "crime"
  | "business"
  | "entertainment"
  | "sports";

export interface Story {
  /** API Story id; absent on the landing page's illustrative cards. */
  id?: string;
  category: string;
  topic: Topic;
  /** Cover photo. A neutral placeholder shows when it is missing or fails to load. */
  imageUrl?: string;
  headline: string;
  body: string;
  /** The Citation Link's outlet (`source_label`). No label, no source line. */
  source?: string;
  /** True only for an Official Source. Shows the green tick. */
  official?: boolean;
  /** Citation Link: the article the Summary was written from. */
  sourceUrl?: string;
  /** ISO time the Story was ingested; drives "4 hours ago". Absent on samples. */
  createdAt?: string;
}

/**
 * Illustrative cards for the landing page: one National, one State and one
 * India-relevant International. They stand in for a story, they do not report
 * one, so the page around them always says they are illustrative. Each Summary
 * stays within the 60-word limit so it fits the fixed card.
 */
export const STORIES: Story[] = [
  {
    category: "National",
    topic: "politics",
    headline: "A ministry announces a national scheme",
    body: "When a ministry announces a scheme, Saransh explains who qualifies, which benefits are included, when applications open, and what changes for people already receiving support. It separates confirmed details from questions the ministry has not answered yet. Readers see what to do next and what remains unclear. The green tick marks a summary taken from the ministry's own statement.",
    source: "Ministry statement",
    official: true,
  },
  {
    category: "State",
    topic: "civic",
    headline: "A state clears a public transport plan",
    body: "When a state clears a public transport plan, Saransh lays out the routes included, the approved cost, and the agency responsible for delivery. It highlights the project timeline, planned service changes, and any decisions that still need public or budget approval. Readers get the practical details first, with the source attached and no prediction about deadlines.",
    source: "News agency · Sample",
  },
  {
    category: "International",
    topic: "business",
    headline: "A trade decision abroad reaches Indian exporters",
    body: "When a decision abroad affects Indian exporters, students, or travellers, Saransh explains the specific rule and who it reaches. The summary gives the effective date, any transition period, and the next step people may need to take. It separates confirmed effects on India from wider speculation, and links the source so readers can check it themselves.",
    source: "Trade publication · Sample",
  },
];

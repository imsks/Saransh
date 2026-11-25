export const TOPICS = [
  "politics",
  "civic",
  "education",
  "crime",
  "business",
  "entertainment",
  "sports",
] as const;

export type Topic = (typeof TOPICS)[number];

export interface Story {
  /** Absent on the landing page's illustrative cards. */
  id?: string;
  topic: Topic;
  imageUrl?: string;
  headline: string;
  body: string;
  /** `source_label`. Saransh is never the source. */
  source?: string;
  official?: boolean;
  sourceUrl?: string;
  /** ISO time the Story was ingested. */
  createdAt?: string;
}

/** Illustrative only (National, State, International). Each Summary stays within 60 words to fit the card. */
export const STORIES: Story[] = [
  {
    topic: "politics",
    headline: "A ministry announces a national scheme",
    body: "When a ministry announces a scheme, Saransh explains who qualifies, which benefits are included, when applications open, and what changes for people already receiving support. It separates confirmed details from questions the ministry has not answered yet. Readers see what to do next and what remains unclear. The green tick marks a summary taken from the ministry's own statement.",
    source: "Ministry statement",
    official: true,
  },
  {
    topic: "civic",
    headline: "A state clears a public transport plan",
    body: "When a state clears a public transport plan, Saransh lays out the routes included, the approved cost, and the agency responsible for delivery. It highlights the project timeline, planned service changes, and any decisions that still need public or budget approval. Readers get the practical details first, with the source attached and no prediction about deadlines.",
    source: "News agency · Sample",
  },
  {
    topic: "business",
    headline: "A trade decision abroad reaches Indian exporters",
    body: "When a decision abroad affects Indian exporters, students, or travellers, Saransh explains the specific rule and who it reaches. The summary gives the effective date, any transition period, and the next step people may need to take. It separates confirmed effects on India from wider speculation, and links the source so readers can check it themselves.",
    source: "Trade publication · Sample",
  },
];

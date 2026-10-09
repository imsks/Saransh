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

export const STORIES: Story[] = [
  {
    category: "National · Parliament",
    time: "2 hrs ago",
    topic: "civic",
    credit: "Lok Sabha · PTI",
    headline: "Parliament passes Digital Personal Data Protection Amendment Bill",
    body: "The Lok Sabha passed the Amendment Bill by voice vote, per the MoS IT. The Bill revises consent requirements for minors and creates a new appeals tribunal. It now goes to the Rajya Sabha.",
    source: "PTI · Official",
    official: true,
  },
  {
    category: "State · Uttar Pradesh",
    time: "4 hrs ago",
    topic: "civic",
    credit: "© PWD Barabanki · CC BY",
    headline: "Deva Road widening stalls again; contractor served 15-day notice",
    body: "The PWD said the Deva Road widening has stalled a third time over a payment dispute. It served the contractor a 15-day notice. The project was to finish by March 2026; 60% of work is complete.",
    source: "Amar Ujala · Barabanki",
  },
  {
    category: "Regional · Barabanki",
    time: "6 hrs ago",
    topic: "education",
    credit: "BSA Office · Press note",
    headline: "12 council schools receive smart classrooms in first phase",
    body: "Per the BSA office, 12 council-run primary schools in Barabanki now have smart classrooms. Phase one covers 3,400 students across four blocks. Phase two is proposed for October.",
    source: "BSA press note · Official",
    official: true,
  },
];

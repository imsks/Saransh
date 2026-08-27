export type ImageVariant = "national" | "road" | "civic";

export interface Story {
  category: string;
  time: string;
  imageVariant: ImageVariant;
  credit: string;
  headline: string;
  body: string;
  source: string;
}

export const STORIES: Story[] = [
  {
    category: "National · Parliament",
    time: "2 hrs ago",
    imageVariant: "national",
    credit: "Lok Sabha · PTI",
    headline: "Parliament passes Digital Personal Data Protection Amendment Bill",
    body: "The Lok Sabha passed the Amendment Bill by voice vote, per the MoS IT. The Bill revises consent requirements for minors and creates a new appeals tribunal. It now goes to the Rajya Sabha.",
    source: "PTI · Official",
  },
  {
    category: "State · Uttar Pradesh",
    time: "4 hrs ago",
    imageVariant: "road",
    credit: "© PWD Barabanki · CC BY",
    headline: "Deva Road widening stalls again; contractor served 15-day notice",
    body: "The PWD said the Deva Road widening has stalled a third time over a payment dispute. It served the contractor a 15-day notice. The project was to finish by March 2026; 60% of work is complete.",
    source: "Amar Ujala · Barabanki",
  },
  {
    category: "Regional · Barabanki",
    time: "6 hrs ago",
    imageVariant: "civic",
    credit: "BSA Office · Press note",
    headline: "12 council schools receive smart classrooms in first phase",
    body: "Per the BSA office, 12 council-run primary schools in Barabanki now have smart classrooms. Phase one covers 3,400 students across four blocks. Phase two is proposed for October.",
    source: "BSA press note · Official",
  },
];

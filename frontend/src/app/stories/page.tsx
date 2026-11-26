import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import SwipeDeck from "@/components/stories/SwipeDeck";
import { fetchStories } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Stories",
  description: "Today's short, sourced news stories from India.",
};

export const revalidate = 60;

const title = (
  <h1 className="font-serif text-[22px] font-semibold tracking-[-0.02em] text-ink compact:text-[20px]">
    Today&apos;s stories
  </h1>
);

/** One screen under the navbar; below 700px tall the page scrolls instead of the card shrinking. */
export default async function StoriesPage() {
  const stories = await fetchStories();

  return (
    <PageShell className="mx-auto flex h-[calc(100dvh-56px)] min-h-[644px] w-full max-w-[462px] flex-col px-4 pt-4 compact:pt-3">
      {stories.length === 0 ? (
        <>
          {title}
          <p className="mt-4 font-sans text-[14px] text-muted">No stories yet. Check back soon.</p>
        </>
      ) : (
        <SwipeDeck stories={stories} title={title} />
      )}
    </PageShell>
  );
}

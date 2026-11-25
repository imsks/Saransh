import type { Metadata } from "next";

import { PageShell } from "@/components/layout";
import StoryCard from "@/components/stories/StoryCard";
import { pageTitleClass } from "@/components/ui";
import { fetchStories } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Stories",
  description: "Today's short, sourced news stories from India.",
};

export const revalidate = 60;

export default async function StoriesPage() {
  const stories = await fetchStories();

  return (
    <PageShell className="mx-auto flex max-w-[496px] flex-col gap-6 px-5 py-10">
      <h1 className={pageTitleClass}>
        Today&apos;s stories
      </h1>
      {stories.length === 0 ? (
        <p className="font-sans text-[14px] text-muted">
          No stories yet. Check back soon.
        </p>
      ) : (
        stories.map((story) => <StoryCard key={story.id} story={story} />)
      )}
    </PageShell>
  );
}

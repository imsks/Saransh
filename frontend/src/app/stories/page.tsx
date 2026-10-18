import type { Metadata } from "next";

import { Footer, Navbar } from "@/components/layout";
import StoryCard from "@/components/stories/StoryCard";
import { fetchStories } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Stories",
  description: "Today's short, sourced news stories from India.",
};

export const revalidate = 60;

export default async function StoriesPage() {
  const stories = await fetchStories();

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <main className="mx-auto flex max-w-[496px] flex-col gap-6 px-5 py-10">
        <h1 className="font-serif text-[28px] font-semibold tracking-[-0.02em] text-ink">
          Today&apos;s stories
        </h1>
        {stories.length === 0 ? (
          <p className="font-sans text-[14px] text-muted">
            No stories yet. Check back soon.
          </p>
        ) : (
          stories.map((story, index) => <StoryCard key={index} story={story} />)
        )}
      </main>
      <Footer />
    </div>
  );
}

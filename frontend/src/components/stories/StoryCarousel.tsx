import { fetchPublishedStories } from "@/lib/stories";
import StoryCarouselClient from "@/components/stories/StoryCarouselClient";
import { STORIES } from "@/constants/stories";

export default async function StoryCarousel() {
  const liveStories = await fetchPublishedStories(3);
  const isSample = liveStories.length === 0;
  const stories = isSample ? STORIES : liveStories;

  return <StoryCarouselClient stories={stories} isSample={isSample} />;
}

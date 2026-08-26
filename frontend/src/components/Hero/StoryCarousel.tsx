import { fetchPublishedStories } from "@/lib/stories";
import StoryCarouselClient from "@/components/Hero/StoryCarouselClient";
import { STORIES } from "@/constants/stories";

export default async function StoryCarousel() {
  const liveStories = await fetchPublishedStories(3);
  const stories = liveStories.length > 0 ? liveStories : STORIES;

  return <StoryCarouselClient stories={stories} isLive={liveStories.length > 0} />;
}

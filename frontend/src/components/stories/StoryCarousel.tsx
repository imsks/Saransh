import StoryCarouselClient from "@/components/stories/StoryCarouselClient";
import { STORIES } from "@/constants/stories";

export default function StoryCarousel() {
  return <StoryCarouselClient stories={STORIES} />;
}

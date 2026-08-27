import type { Story, ImageVariant } from "@/constants/stories";
import { getStoriesApiBaseUrl } from "@/lib/api-base";

export interface ApiStorySource {
  outlet: string;
  url: string;
}

export interface ApiStory {
  id: string;
  title_en: string;
  summary_en: string;
  category: string;
  state?: string | null;
  district?: string | null;
  status: string;
  sources: ApiStorySource[];
  created_at: string;
}

function categoryLabel(story: ApiStory): string {
  const parts = [story.category];
  if (story.state) parts.push(story.state);
  if (story.district) parts.push(story.district);
  return parts.join(" · ");
}

function relativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(deltaMs / (1000 * 60 * 60)));
  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
}

function imageVariantFor(story: ApiStory): ImageVariant {
  const category = story.category.toLowerCase();
  if (category.includes("national") || category.includes("parliament")) return "national";
  if (category.includes("road") || category.includes("infrastructure")) return "road";
  return "civic";
}

/** Map a FastAPI story payload into the carousel card shape. */
export function mapApiStoryToCarousel(story: ApiStory): Story {
  const primarySource = story.sources[0];

  return {
    category: categoryLabel(story),
    time: relativeTime(story.created_at),
    imageVariant: imageVariantFor(story),
    credit: primarySource?.outlet ?? "Saransh",
    headline: story.title_en,
    body: story.summary_en,
    source: primarySource ? `${primarySource.outlet} · Verified` : "Saransh",
  };
}

/** Fetch published stories for the landing-page carousel. Falls back to an empty list on error. */
export async function fetchPublishedStories(limit = 3): Promise<Story[]> {
  const base = getStoriesApiBaseUrl({ forServer: true });
  const url = `${base}?status=published&limit=${limit}`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return [];

    const payload = (await response.json()) as ApiStory[];
    if (!Array.isArray(payload) || payload.length === 0) return [];

    return payload.map(mapApiStoryToCarousel);
  } catch {
    return [];
  }
}

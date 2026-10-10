import type { Story, Topic } from "@/constants/stories";
import { getApiBaseUrl } from "@/lib/api-base";
import { logger } from "@/lib/logger";

export interface ApiStorySource {
  outlet: string;
  url: string;
}

export interface ApiStory {
  id: string;
  title_en: string;
  summary_en: string;
  image_url: string;
  source_url?: string | null;
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
  if (!Number.isFinite(deltaMs) || deltaMs < 1000 * 60 * 60) return "Just now";

  const hours = Math.min(12, Math.floor(deltaMs / (1000 * 60 * 60)));
  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
}

const TOPICS: Topic[] = [
  "politics",
  "civic",
  "education",
  "crime",
  "business",
  "entertainment",
  "sports",
];

const TOPIC_KEYWORDS: [Topic, string[]][] = [
  ["politics", ["politic", "parliament", "election", "minister", "government"]],
  ["education", ["education", "school", "college", "university", "exam"]],
  ["crime", ["crime", "police", "court", "arrest", "fir"]],
  ["business", ["business", "economy", "market", "trade", "job", "employment"]],
  ["entertainment", ["entertainment", "film", "cinema", "music", "bollywood"]],
  ["sports", ["sport", "cricket", "football", "olympic", "match"]],
  ["civic", ["civic", "road", "transport", "health", "hospital", "infrastructure"]],
];

/**
 * Pick the topic from the story's free-text category: an exact topic key first
 * (case-insensitive), then a keyword match. Civic is the default.
 */
export function topicFor(category: string): Topic {
  const lowered = category.trim().toLowerCase();

  const exact = TOPICS.find((topic) => topic === lowered);
  if (exact) return exact;

  const match = TOPIC_KEYWORDS.find(([, keywords]) => keywords.some((k) => lowered.includes(k)));
  return match ? match[0] : "civic";
}

/** Map a FastAPI story payload into the carousel card shape. */
export function mapApiStoryToCarousel(story: ApiStory): Story {
  const primarySource = story.sources[0];

  return {
    category: categoryLabel(story),
    time: relativeTime(story.created_at),
    topic: topicFor(story.category),
    imageUrl: story.image_url || undefined,
    credit: primarySource?.outlet ?? "Saransh",
    headline: story.title_en,
    body: story.summary_en,
    // No "Verified" and no tick: the API has no `official` field, so nothing
    // from it may claim verification.
    source: primarySource?.outlet ?? "Saransh",
    // Stories ingested before source_url existed fall back to their first source.
    sourceUrl: story.source_url || primarySource?.url || undefined,
  };
}

/** Fetch published stories for the landing-page carousel. Falls back to an empty list on error. */
export async function fetchPublishedStories(limit = 3): Promise<Story[]> {
  const base = getApiBaseUrl({ forServer: true });
  const url = `${base}/stories?status=published&limit=${limit}`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      logger.warn({ url, status: response.status }, "stories.fetch_failed");
      return [];
    }

    const payload = (await response.json()) as ApiStory[];
    if (!Array.isArray(payload) || payload.length === 0) return [];

    return payload.map(mapApiStoryToCarousel);
  } catch (err) {
    logger.error({ err, url }, "stories.fetch_error");
    return [];
  }
}

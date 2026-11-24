import { OFFICIAL_SOURCE_DOMAINS, OFFICIAL_SOURCE_LABELS } from "@/constants/sources";
import type { Story, Topic } from "@/constants/stories";
import { getApiBaseUrl } from "@/lib/api-base";
import { logger } from "@/lib/logger";

export interface ApiStory {
  id: string;
  title_en: string;
  summary_en: string;
  image_url: string;
  source_url?: string | null;
  source_label?: string | null;
  category: string;
  tier?: "national" | "state" | "international" | null;
  state?: string | null;
  status: string;
  created_at: string;
}

function categoryLabel(story: ApiStory): string {
  const parts = [story.category];
  if (story.state) parts.push(story.state);
  return parts.join(" · ");
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
  ["civic",["civic", "road", "transport", "health", "hospital", "infrastructure"],],
];

/**
 * Pick the topic from the story's free-text category: an exact topic key first
 * (case-insensitive), then a keyword match. Civic is the default.
 */
export function topicFor(category: string): Topic {
  const lowered = category.trim().toLowerCase();

  const exact = TOPICS.find((topic) => topic === lowered);
  if (exact) return exact;

  const match = TOPIC_KEYWORDS.find(([, keywords]) =>
    keywords.some((k) => lowered.includes(k)),
  );
  return match ? match[0] : "civic";
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * An Official Source: a `source_url` host on gov.in or nic.in (or a
 * sub-domain), or a `source_label` on the short list in config.
 * A look-alike such as gov.in.example.com is not one.
 */
export function isOfficialSource(
  sourceUrl?: string | null,
  sourceLabel?: string | null,
): boolean {
  const host = sourceUrl ? hostOf(sourceUrl) : null;
  if (host && OFFICIAL_SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    return true;
  }
  const label = sourceLabel?.trim().toLowerCase();
  return !!label && OFFICIAL_SOURCE_LABELS.some((l) => l.toLowerCase() === label);
}

/** Map a FastAPI story payload into the card shape. Saransh is never the source. */
export function mapApiStoryToCarousel(story: ApiStory): Story {
  return {
    id: story.id,
    category: categoryLabel(story),
    topic: topicFor(story.category),
    imageUrl: story.image_url || undefined,
    headline: story.title_en,
    body: story.summary_en,
    source: story.source_label || undefined,
    sourceUrl: story.source_url || undefined,
    official: isOfficialSource(story.source_url, story.source_label),
    createdAt: story.created_at,
  };
}

/** Latest published Stories for server rendering; an unreachable API yields none. */
export async function fetchStories(limit = 50): Promise<Story[]> {
  try {
    const response = await fetch(
      `${getApiBaseUrl({ forServer: true })}/stories?status=published&limit=${limit}`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) {
      logger.warn({ status: response.status }, "stories.fetch_failed");
      return [];
    }
    const stories = (await response.json()) as ApiStory[];
    return stories.map(mapApiStoryToCarousel);
  } catch (err) {
    logger.warn({ err }, "stories.fetch_failed");
    return [];
  }
}

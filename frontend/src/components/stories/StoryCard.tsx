import { Icon, cardClass, cx, focusRingClass } from "@/components/ui";
import type { Story, Topic } from "@/constants/stories";

import StoryImage from "./StoryImage";
import TimeAgo from "./TimeAgo";

/** The Topic label: its name in its colour, never colour alone. */
const TOPIC: Record<Topic, { name: string; className: string }> = {
  politics: { name: "Politics", className: "text-topic-politics" },
  civic: { name: "Civic", className: "text-topic-civic" },
  education: { name: "Education", className: "text-topic-education" },
  crime: { name: "Crime", className: "text-topic-crime" },
  business: { name: "Business & Economy", className: "text-topic-business" },
  entertainment: { name: "Entertainment", className: "text-topic-entertainment" },
  sports: { name: "Sports", className: "text-topic-sports" },
};

/** The green tick. It means "Official Source" and nothing else. */
const officialTick = (
  <Icon size={13} strokeWidth={3} data-official-tick="" className="shrink-0 text-green">
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

/**
 * The source line names the Citation Link's outlet and links to the original.
 * No label, no line; no URL, plain text. Saransh is never the source.
 */
function SourceLine({ story }: { story: Story }) {
  if (!story.source) return null;

  const content = (
    <>
      {story.official && officialTick}
      <span className="truncate">{story.source}</span>
    </>
  );

  if (!story.sourceUrl) {
    return <span className="inline-flex min-w-0 items-center gap-1.5">{content}</span>;
  }

  return (
    <a
      href={story.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${story.source}, opens the original in a new tab`}
      className={cx(
        "inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-sm underline-offset-2 hover:underline focus-visible:underline",
        focusRingClass,
      )}
    >
      {content}
    </a>
  );
}

/**
 * The story card (mock v5): photo, Topic row, headline, Summary, then one
 * footer row with the source link and how long ago. Fixed height: the longest
 * allowed text (a 3-line headline, a 60-word Summary) fits at 390px wide.
 */
export default function StoryCard({ story }: { story: Story }) {
  const topic = TOPIC[story.topic];

  return (
    <article
      className={cx(
        cardClass({ variant: "elevated", padding: "none" }),
        "flex h-[612px] w-full flex-col overflow-hidden font-sans text-ink",
      )}
    >
      <StoryImage src={story.imageUrl} source={story.source} />

      <div className="flex flex-1 flex-col px-[18px] py-[14px]">
        <div className="flex h-[26px] items-center justify-between">
          <span className={`text-[12px] font-bold leading-none ${topic.className}`}>
            {topic.name}
          </span>
          {/* Kept free for the Share icon (#146). */}
          <span aria-hidden="true" data-share-slot="" className="w-11 shrink-0" />
        </div>

        <h2 className="mb-2 mt-[6px] font-sans text-[22px] font-extrabold leading-[1.27] tracking-[-0.015em] text-ink">
          {story.headline}
        </h2>

        <p className="text-[14.5px] leading-[1.55] text-body">{story.body}</p>

        <div className="min-h-2 flex-1" />

        <footer className="flex min-h-11 items-center gap-1.5 text-[12.5px] leading-[1.35] text-muted">
          <SourceLine story={story} />
          {story.source && story.createdAt && <span aria-hidden="true">·</span>}
          {story.createdAt && <TimeAgo iso={story.createdAt} />}
        </footer>
      </div>
    </article>
  );
}

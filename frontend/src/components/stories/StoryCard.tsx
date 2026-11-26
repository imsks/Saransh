import { ExternalLink, Icon, cardClass, cx, focusRingClass, pressTransitionClass } from "@/components/ui";
import type { Story, Topic } from "@/constants/stories";

import StoryImage from "./StoryImage";
import TimeAgo from "./TimeAgo";

/** The Topic shows its name in its colour, never colour alone. */
const TOPIC: Record<Topic, { name: string; className: string }> = {
  politics: { name: "Politics", className: "text-topic-politics" },
  civic: { name: "Civic", className: "text-topic-civic" },
  education: { name: "Education", className: "text-topic-education" },
  crime: { name: "Crime", className: "text-topic-crime" },
  business: { name: "Business & Economy", className: "text-topic-business" },
  entertainment: { name: "Entertainment", className: "text-topic-entertainment" },
  sports: { name: "Sports", className: "text-topic-sports" },
};

const officialTick = (
  <Icon size={13} strokeWidth={3} data-official-tick="" className="shrink-0 text-green">
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

/** Saransh is never the source: no label, no line. */
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
    <ExternalLink
      href={story.sourceUrl}
      aria-label={`${story.source}, opens the original in a new tab`}
      className={cx(
        "inline-flex min-h-11 min-w-0 origin-left items-center gap-1.5 rounded-sm underline-offset-2 hover:underline focus-visible:underline active:opacity-70 motion-safe:active:scale-[0.96]",
        pressTransitionClass,
        focusRingClass,
      )}
    >
      {content}
    </ExternalLink>
  );
}

/**
 * One template for every story and it fills its slot. The content limits (a 3-line
 * headline, a 60-word body) make it fit, so a short story only leaves space above the source row.
 */
export default function StoryCard({ story }: { story: Story }) {
  const topic = TOPIC[story.topic];

  return (
    <article
      className={cx(
        cardClass({ variant: "elevated", padding: "none" }),
        "flex h-full w-full flex-col overflow-hidden font-sans text-ink",
      )}
    >
      <StoryImage src={story.imageUrl} source={story.source} />

      <div className="flex flex-1 flex-col px-[18px] py-[14px]">
        <div className="flex h-[26px] shrink-0 items-center justify-between">
          <span className={`text-[12px] font-bold leading-none ${topic.className}`}>
            {topic.name}
          </span>
          {/* Kept free for the Share icon. */}
          <span aria-hidden="true" data-share-slot="" className="w-11 shrink-0" />
        </div>

        <h2 className="mb-2 mt-[6px] line-clamp-3 font-sans text-[22px] font-extrabold leading-[1.27] tracking-[-0.015em] text-ink compact:text-[20px]">
          {story.headline}
        </h2>

        <p className="text-[14.5px] leading-[1.55] text-body compact:text-[13.5px] compact:leading-[1.5]">
          {story.body}
        </p>

        <div className="min-h-2 flex-1" />

        <footer className="flex min-h-11 shrink-0 items-center gap-1.5 text-[12.5px] leading-[1.35] text-muted">
          <SourceLine story={story} />
          {story.source && story.createdAt && <span aria-hidden="true">·</span>}
          {story.createdAt && <TimeAgo iso={story.createdAt} />}
        </footer>
      </div>
    </article>
  );
}

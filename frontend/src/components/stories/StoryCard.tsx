import type { Story, Topic } from "@/constants/stories";

/** Topic colour is allowed in exactly two places: the topic label and the illustration wash. */
const topicClass: Record<Topic, { time: string; wash: string }> = {
  politics: { time: "text-topic-politics", wash: "bg-topic-politics-bg" },
  civic: { time: "text-topic-civic", wash: "bg-topic-civic-bg" },
  education: { time: "text-topic-education", wash: "bg-topic-education-bg" },
  crime: { time: "text-topic-crime", wash: "bg-topic-crime-bg" },
  business: { time: "text-topic-business", wash: "bg-topic-business-bg" },
  entertainment: { time: "text-topic-entertainment", wash: "bg-topic-entertainment-bg" },
  sports: { time: "text-topic-sports", wash: "bg-topic-sports-bg" },
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

const readStoryClass =
  "mr-[3px] inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-ink bg-card px-[22px] font-sans text-[14.5px] font-bold text-ink no-underline shadow-[3px_3px_0_var(--cta-shadow)]";

/** The green tick. It means "official source" and nothing else. */
function OfficialTick() {
  return (
    <svg
      data-official-tick=""
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-green"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** The outlet credit: plain, muted, never bold. Links to the citation when the story has one. */
function SourceLine({ story }: { story: Story }) {
  const content = (
    <>
      {story.official ? <OfficialTick /> : null}
      <span>{story.source}</span>
    </>
  );
  const lineClass =
    "inline-flex min-w-0 items-center gap-1.5 font-sans text-[12.5px] leading-[1.35] text-muted";

  if (!story.sourceUrl) {
    return <div className={lineClass}>{content}</div>;
  }

  return (
    <a
      href={story.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${story.source} — source article for ${story.headline}`}
      className={`${lineClass} underline-offset-2 hover:underline ${focusRing}`}
    >
      {content}
    </a>
  );
}

/** The app story card from design system v1.2: one handheld card per screen. */
export default function StoryCard({ story }: { story: Story }) {
  const topic = topicClass[story.topic];

  return (
    <article className="flex flex-col overflow-hidden rounded-[24px] border border-edge bg-card text-ink shadow-app-card">
      <div
        className={`relative h-[168px] ${story.imageUrl ? "bg-img-bg" : topic.wash}`}
        data-topic={story.topic}
      >
        {story.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.imageUrl}
            alt={story.headline}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <span className="absolute bottom-3 right-3 z-[1] rounded-[6px] bg-scrim px-2 py-[3px] font-sans text-[10.5px] text-white">
          {story.credit}
        </span>
      </div>
      <div className="px-[18px] pb-4 pt-[18px]">
        <h2 className="mb-2 font-sans text-[22px] font-extrabold leading-[1.27] tracking-[-0.015em] text-ink">
          {story.headline}
        </h2>
        <p className="font-sans text-[14.5px] leading-[1.55] text-body">{story.body}</p>
        <p className={`mt-3.5 font-sans text-[12.5px] font-bold ${topic.time}`}>{story.time}</p>
        <div className="mt-[18px] flex items-center justify-between gap-3">
          <SourceLine story={story} />
          {story.sourceUrl ? (
            <a
              href={story.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read story: ${story.headline}`}
              className={`${readStoryClass} ${focusRing}`}
            >
              Read story
            </a>
          ) : (
            // Sample stories have no article behind them: the button is shown, not live.
            <span aria-hidden="true" className={`${readStoryClass} cursor-default select-none`}>
              Read story
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

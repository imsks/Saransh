import { Story } from "@/constants/stories";

const imageClassMap = {
  national: "bg-gradient-to-br from-[#8FAE96] to-[#3E6B4A]",
  road: "bg-gradient-to-br from-[#B5AFA4] via-[#7A756B] via-60% to-[#4A4640]",
  civic: "bg-gradient-to-br from-[#7E9BAF] to-[#3E5D75]",
} as const;

const badgeClass =
  "inline-flex items-center gap-1.5 rounded-sm border-[1.5px] border-red bg-red-tint px-2 py-0.5 font-mono text-[10px] text-red";

/** The outlet credit. Links to the citation link when the story has one. */
function SourceBadge({ story }: { story: Story }) {
  const dot = <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-red" />;

  if (!story.sourceUrl) {
    return (
      <div className={badgeClass}>
        {dot}
        <span>{story.source}</span>
      </div>
    );
  }

  return (
    <a
      href={story.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${story.source} — source article for ${story.headline}`}
      className={`${badgeClass} underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red`}
    >
      {dot}
      <span>{story.source}</span>
    </a>
  );
}

export default function StoryCard({ story }: { story: Story }) {
  return (
    <div className="relative">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-red">
          {story.category}
        </span>
        <span className="font-mono text-[10px] text-muted">{story.time}</span>
      </div>
      <div
        className={`relative mb-3 h-[108px] overflow-hidden rounded-sm after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_30%_35%,rgba(255,255,255,0.1)_0%,transparent_60%)] ${imageClassMap[story.imageVariant]}`}
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
        <span className="absolute bottom-1.5 left-1.5 z-[1] rounded-sm bg-scrim px-1.5 py-0.5 font-mono text-[9px] text-white">
          {story.credit}
        </span>
      </div>
      <p className="mb-2 font-serif text-[18.5px] font-semibold leading-[1.25] tracking-tight text-ink">
        {story.headline}
      </p>
      <p className="mb-3 font-sans text-[13.5px] leading-[1.6] text-muted">{story.body}</p>
      <div className="flex items-center justify-between">
        <SourceBadge story={story} />
      </div>
    </div>
  );
}

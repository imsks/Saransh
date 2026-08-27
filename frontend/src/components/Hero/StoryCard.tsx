import { Story } from "@/constants/stories";

const imageClassMap = {
  national: "bg-gradient-to-br from-[#8FAE96] to-[#3E6B4A]",
  road: "bg-gradient-to-br from-[#B5AFA4] via-[#7A756B] via-60% to-[#4A4640]",
  civic: "bg-gradient-to-br from-[#7E9BAF] to-[#3E5D75]",
} as const;

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
        <span className="absolute bottom-1.5 left-1.5 z-[1] rounded-sm bg-black/35 px-1.5 py-0.5 font-mono text-[9px] text-white/85">
          {story.credit}
        </span>
      </div>
      <p className="mb-2 font-serif text-[18.5px] font-semibold leading-tight tracking-tight text-ink">
        {story.headline}
      </p>
      <p className="mb-3 font-sans text-[13.5px] leading-[1.6] text-[#2D3139]">{story.body}</p>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-sm border-[1.5px] border-red bg-red-tint px-2 py-0.5">
          <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-red" />
          <span className="font-mono text-[10px] text-red">{story.source} ↗</span>
        </div>
        <div className="flex flex-col items-center gap-[2.5px]" aria-hidden="true">
          <span className="h-[3.5px] w-[3.5px] rounded-full bg-muted" />
          <span className="h-[3.5px] w-[3.5px] rounded-full bg-muted" />
          <span className="h-[3.5px] w-[3.5px] rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

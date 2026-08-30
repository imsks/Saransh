export default function Footer() {
  return (
    <footer className="border-t-[1.5px] border-ink pb-10 pt-7">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-start justify-between gap-6 px-8 max-[560px]:flex-col max-[560px]:px-5">
        <div>
          <div className="mb-1.5 flex items-baseline gap-[7px]">
            <span className="font-serif text-[15px] font-semibold text-ink">Saransh</span>
            <span className="font-serif text-sm italic text-red">सारांश</span>
          </div>
          <p className="font-mono text-[10px] text-muted">
            आपके ज़िले की खबर, 60 शब्दों में, सबूत के साथ।
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 max-[560px]:items-start">
          <a
            href="https://github.com/imsks/Saransh"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10.5px] uppercase text-muted no-underline transition-colors hover:text-ink"
          >
            GitHub ↗
          </a>
          <a
            href="https://rajniti-app.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10.5px] uppercase text-muted no-underline transition-colors hover:text-ink"
          >
            Rajniti ↗
          </a>
          <div className="text-right font-mono text-[10px] leading-[1.65] text-muted max-[560px]:text-left">
            <div>Built with ❤️ for the AI and news community</div>
            <div>
              Follow the build →{" "}
              <a
                href="https://github.com/imsks/Saransh"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink no-underline"
              >
                Saransh
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

import { Container } from "@/components/ui";
import { EXTERNAL, ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="border-t border-line pb-10 pt-7">
      <Container className="flex flex-wrap items-start justify-between gap-6 max-[560px]:flex-col">
        <div>
          <div className="mb-1.5 flex items-baseline gap-[7px]">
            <span className="font-serif text-[16px] font-semibold text-ink">Saransh</span>
            <span lang="hi" className="font-hindi text-sm text-red">सारांश</span>
          </div>
          <p lang="hi" className="font-hindi text-[11px] text-muted">
            शोर नहीं। सिर्फ़ खबर। सबूत के साथ।
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 max-[560px]:items-start">
          <Link
            href={ROUTES.privacy}
            className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.06em] text-muted no-underline transition-colors hover:text-ink"
          >
            Privacy
          </Link>
          <div className="text-right font-mono text-[11px] leading-[1.65] text-muted max-[560px]:text-left mt-2">
            <div>Built with ❤️ for the AI and news community</div>
            <div>
              Follow the build →{" "}
              <a
                href={EXTERNAL.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink no-underline"
              >
                Saransh
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

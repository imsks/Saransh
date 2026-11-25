import Link from "next/link";

import { Container, ExternalLink } from "@/components/ui";
import { EXTERNAL, ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="border-t border-line pb-10 pt-7">
      <Container className="flex flex-wrap items-start justify-between gap-6 max-[560px]:flex-col">
        <span className="font-serif text-[16px] font-semibold text-red">Saransh</span>
        <div className="flex flex-col items-end gap-2 max-[560px]:items-start">
          <Link
            href={ROUTES.privacy}
            className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.06em] text-muted no-underline transition-colors hover:text-ink"
          >
            Privacy
          </Link>
          <div className="mt-2 text-right font-mono text-[11px] leading-[1.65] text-muted max-[560px]:text-left">
            <div>Built with ❤️ for the AI and news community</div>
            <div>
              Follow the build →{" "}
              <ExternalLink href={EXTERNAL.repo} className="font-semibold text-ink no-underline">
                Saransh
              </ExternalLink>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

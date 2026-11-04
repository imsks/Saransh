import Link from "next/link";

import AccountButton from "@/components/auth/AccountButton";
import ThemeSwitch from "@/components/layout/ThemeSwitch";
import { Container } from "@/components/ui";
import { EXTERNAL, ROUTES } from "@/lib/routes";

const navLinkClass =
  "inline-flex min-h-11 items-center font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-muted no-underline transition-colors hover:text-ink";

export default function Navbar() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-[100] h-14 w-full border-b border-line bg-paper/90 backdrop-blur-md"
    >
      <Container className="flex h-full items-center justify-between">
        <Link
          href={ROUTES.home}
          className="font-serif text-[18px] font-semibold tracking-[-0.01em] text-ink no-underline"
        >
          Saransh
        </Link>

        <div className="flex items-center gap-5 max-[400px]:gap-3.5">
          <Link href={ROUTES.stories} className={navLinkClass}>
            Stories
          </Link>
          {/* Hidden on phones so the bar fits at 360px; the section is on the page. */}
          <Link href={ROUTES.contribute} className={`${navLinkClass} max-[560px]:hidden`}>
            Contribute
          </Link>
          <a
            href={EXTERNAL.repo}
            target="_blank"
            rel="noopener noreferrer"
            className={`${navLinkClass} max-[560px]:hidden`}
          >
            GitHub
          </a>
          <AccountButton />
          <ThemeSwitch />
        </div>
      </Container>
    </nav>
  );
}

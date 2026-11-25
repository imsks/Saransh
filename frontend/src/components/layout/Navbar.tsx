import Link from "next/link";

import AccountButton from "@/components/auth/AccountButton";
import ThemeSwitch from "@/components/layout/ThemeSwitch";
import { Container, ExternalLink, navLinkClass } from "@/components/ui";
import { EXTERNAL, ROUTES } from "@/lib/routes";

/** Hidden on phones so the bar fits at 360px; the section is on the page. */
const wideOnlyLinkClass = `${navLinkClass} max-[560px]:hidden`;

export default function Navbar() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-[100] h-14 w-full border-b border-line bg-paper/90 backdrop-blur-md"
    >
      <Container className="flex h-full items-center justify-between">
        <Link
          href={ROUTES.home}
          className="font-serif text-[18px] font-semibold tracking-[-0.01em] text-red no-underline"
        >
          Saransh
        </Link>

        <div className="flex items-center gap-5 max-[400px]:gap-3.5">
          <Link href={ROUTES.stories} className={navLinkClass}>
            Stories
          </Link>
          <Link href={ROUTES.contribute} className={wideOnlyLinkClass}>
            Contribute
          </Link>
          <ExternalLink href={EXTERNAL.repo} className={wideOnlyLinkClass}>
            GitHub
          </ExternalLink>
          <AccountButton />
          <ThemeSwitch />
        </div>
      </Container>
    </nav>
  );
}

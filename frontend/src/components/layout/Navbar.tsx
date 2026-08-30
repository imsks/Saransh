import Link from "next/link";

import { ThemeToggle } from "@sutra_ui/ui";

import { EXTERNAL, ROUTES } from "@/lib/routes";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-[100] h-14 w-full border-b border-line bg-paper">
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-8 max-[560px]:px-5">
        <Link
          href={ROUTES.home}
          className="font-serif text-lg font-semibold tracking-tight text-ink no-underline"
        >
          Saransh
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href={ROUTES.contributors}
            className="font-mono text-[11.5px] font-normal uppercase tracking-wider text-muted no-underline transition-colors hover:text-ink max-[560px]:hidden"
          >
            Contributors
          </Link>
          <a
            href={EXTERNAL.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11.5px] font-normal uppercase tracking-wider text-muted transition-colors hover:text-ink"
          >
            GitHub ↗
          </a>
          <ThemeToggle className="size-8 rounded-sm border-line bg-transparent text-muted hover:bg-card hover:text-ink" />
        </div>
      </div>
    </nav>
  );
}

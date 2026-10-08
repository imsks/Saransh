import Link from "next/link";

import ThemeSwitch from "@/components/layout/ThemeSwitch";
import { EXTERNAL, ROUTES } from "@/lib/routes";

export default function Navbar() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-[100] h-14 w-full border-b border-line bg-paper"
    >
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-8 max-[560px]:px-5">
        <Link
          href={ROUTES.home}
          className="font-serif text-[18px] font-semibold tracking-[-0.01em] text-ink no-underline"
        >
          Saransh
          <span lang="hi" className="font-medium tracking-[-0.01em] font-hindi text-[16px] text-red ml-2">
            सारांश
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <a
            href={EXTERNAL.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-muted transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <ThemeSwitch />
        </div>
      </div>
    </nav>
  );
}

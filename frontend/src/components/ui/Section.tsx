import type { HTMLAttributes, ReactNode } from "react";

import { cx, eyebrowClass, type EyebrowTone } from "./styles";

export type ContainerSize = "default" | "narrow";

const CONTAINER_SIZE: Record<ContainerSize, string> = {
  default: "max-w-[1120px]",
  narrow: "max-w-[720px]",
};

type ContainerProps = HTMLAttributes<HTMLDivElement> & { size?: ContainerSize };

/** The page column: one max width and gutter for every page. */
export function Container({ size = "default", className, ...props }: ContainerProps) {
  return (
    <div
      className={cx("mx-auto w-full px-8 max-[560px]:px-5", CONTAINER_SIZE[size], className)}
      {...props}
    />
  );
}

type SectionProps = HTMLAttributes<HTMLElement> & { size?: ContainerSize };

/** A band of the page, ruled off from the one above like a broadsheet column. */
export function Section({ size, className, children, ...props }: SectionProps) {
  return (
    <section className={cx("border-t border-line py-20 max-[560px]:py-14", className)} {...props}>
      <Container size={size}>{children}</Container>
    </section>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  eyebrow?: string;
  eyebrowTone?: EyebrowTone;
  lead?: ReactNode;
  align?: "start" | "center";
  /** Lets the enclosing section point `aria-labelledby` at the heading. */
  id?: string;
  className?: string;
}

/** Eyebrow, heading and lead: the same type scale at the top of every section. */
export function SectionHeader({
  title,
  eyebrow,
  eyebrowTone,
  lead,
  align = "start",
  id,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cx("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <span className={cx(eyebrowClass(eyebrowTone), "mb-3.5")}>{eyebrow}</span> : null}
      <h2
        id={id}
        className="font-serif text-[clamp(26px,3.2vw,38px)] font-semibold leading-[1.12] tracking-[-0.02em] text-ink"
      >
        {title}
      </h2>
      {lead ? (
        <div className="mt-4 flex flex-col gap-3 font-sans text-[15.5px] leading-[1.72] text-muted">
          {lead}
        </div>
      ) : null}
    </header>
  );
}

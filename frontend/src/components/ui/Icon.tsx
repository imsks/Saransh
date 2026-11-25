import type { ReactNode, SVGProps } from "react";

export default function Icon({
  size,
  strokeWidth = 2,
  viewBox = "0 0 24 24",
  children,
  ...rest
}: { size: number; children: ReactNode } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

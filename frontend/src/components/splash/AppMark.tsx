
export default function AppMark() {
  return (
    <span
      aria-hidden="true"
      data-testid="app-mark"
      className="splash-icon inline-flex size-[112px] items-center justify-center rounded-[29px] bg-ink"
    >
      <svg viewBox="0 0 100 100" width={69} height={69} fill="none" focusable="false">
        <g className="splash-lines" stroke="var(--paper)" strokeWidth={11} strokeLinecap="round">
          <path d="M10 22H90" />
          <path d="M10 48H84" />
          <path d="M10 74H44" />
        </g>
        <circle className="splash-dot" cx={72} cy={74} r={10} fill="var(--red)" />
      </svg>
    </span>
  );
}

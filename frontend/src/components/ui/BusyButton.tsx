import type { ButtonHTMLAttributes } from "react";

type BusyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { busy: boolean };

/**
 * While busy: a spinner over the label, kept transparent so the button keeps its
 * width and its name, and a second tap (or submit) does nothing.
 */
export default function BusyButton({ busy, onClick, children, ...props }: BusyButtonProps) {
  return (
    <button
      {...props}
      aria-busy={busy}
      onClick={(event) => {
        if (busy) event.preventDefault();
        else onClick?.(event);
      }}
    >
      <span className={busy ? "opacity-0" : undefined}>{children}</span>
      {busy && (
        <span
          aria-hidden="true"
          data-spinner=""
          className="absolute inset-0 m-auto size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
    </button>
  );
}

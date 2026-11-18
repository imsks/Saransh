import { buttonClass } from "@/components/ui/styles";

export default function SplashOffline({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="absolute inset-x-6 bottom-[84px] flex flex-col items-center gap-3 text-center"
    >
      <p className="font-sans text-[17px] font-bold text-ink">You&apos;re offline</p>
      <p className="font-sans text-[14px] leading-[1.55] text-muted">
        Check your internet connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={buttonClass({ variant: "primary", fullWidth: true })}
      >
        Try again
      </button>
    </div>
  );
}

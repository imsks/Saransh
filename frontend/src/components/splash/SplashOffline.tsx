"use client";

import { useState } from "react";

import { BusyButton, buttonClass } from "@/components/ui";

export default function SplashOffline({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div
      role="alert"
      className="absolute inset-x-6 bottom-[84px] flex flex-col items-center gap-3 text-center"
    >
      <p className="font-sans text-[17px] font-bold text-ink">You&apos;re offline</p>
      <p className="font-sans text-[14px] leading-[1.55] text-muted">
        Check your internet connection and try again.
      </p>
      <BusyButton
        type="button"
        busy={retrying}
        onClick={() => {
          setRetrying(true);
          onRetry();
        }}
        className={buttonClass({ fullWidth: true })}
      >
        Try again
      </BusyButton>
    </div>
  );
}

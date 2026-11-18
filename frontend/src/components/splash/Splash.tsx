"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import AppMark from "@/components/splash/AppMark";
import SplashOffline from "@/components/splash/SplashOffline";
import { isSharedStoryPath } from "@/lib/routes";

/** Just past the end of the intro (the footer's rise ends at 1.9s). Always played in full. */
export const SPLASH_INTRO_MS = 2000;
/** How long the splash takes to fade out once the intro is done. */
export const SPLASH_FADE_MS = 300;

type Phase = "intro" | "offline" | "done";

const FADE_OUT = `splash-out ${SPLASH_FADE_MS}ms ease-out ${SPLASH_INTRO_MS}ms forwards`;

export default function Splash() {
  const pathname = usePathname();
  // Decided on the first render only: the layout never remounts in-app.
  const [skip] = useState(() => isSharedStoryPath(pathname));
  const [phase, setPhase] = useState<Phase>(skip ? "done" : "intro");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skip) return;

    // How far the CSS fade has run; it started at first paint, before hydration.
    const elapsed = Number(
      ref.current
        ?.getAnimations?.()
        .find((a) => (a as CSSAnimation).animationName === "splash-out")?.currentTime ?? 0,
    );
    const introLeft = Math.max(0, SPLASH_INTRO_MS - elapsed);

    const intro = setTimeout(() => {
      if (elapsed < SPLASH_INTRO_MS && !navigator.onLine) setPhase("offline");
    }, introLeft);
    
    const done = setTimeout(
      () => setPhase((p) => (p === "offline" ? p : "done")),
      introLeft + SPLASH_FADE_MS,
    );

    return () => {
      clearTimeout(intro);
      clearTimeout(done);
    };
  }, [skip]);

  // The page underneath must not scroll while the splash covers it.
  useEffect(() => {
    if (phase === "done") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={ref}
      data-testid="splash"
      className="fixed inset-0 z-[1000] bg-paper"
      style={phase === "intro" ? { animation: FADE_OUT } : undefined}
    >
      {/* Only under reduced motion, where nothing on screen moves to show progress. */}
      <p role="status" className="sr-only hidden motion-reduce:block">
        Loading Saransh
      </p>

      <div className="flex h-full flex-col items-center justify-center gap-[22px] px-[30px] text-center">
        <AppMark />
        <p className="splash-rise font-serif text-[40px] font-semibold leading-none text-ink [animation-delay:0.85s]">
          Saransh
        </p>
        <p className="splash-rise max-w-[290px] font-sans text-[16.5px] leading-[1.6] text-body [animation-delay:1.15s]">
          No noise. Just news. With proof.
        </p>
      </div>

      {phase === "offline" && <SplashOffline onRetry={() => window.location.reload()} />}

      <p className="splash-rise absolute inset-x-0 bottom-[34px] text-center font-sans text-[12.5px] text-muted [animation-delay:1.4s]">
        Open source · for India
      </p>
    </div>
  );
}

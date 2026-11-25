"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui";

const imageIcon = (
  <Icon size={30} strokeWidth={1.8} className="text-muted">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-4.5-4.5L5 21" />
  </Icon>
);

/** 1.91:1 is the ratio publishers use for share images. */
export default function StoryImage({ src, source }: { src?: string; source?: string }) {
  const [failed, setFailed] = useState(!src);
  const ref = useRef<HTMLImageElement>(null);

  // A photo that failed before hydration never reaches React's onError.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div
      data-testid="story-image"
      className="relative flex aspect-[1.91/1] w-full shrink-0 items-center justify-center bg-img-bg"
    >
      {failed ? (
        imageIcon
      ) : (
        <>
          {/* The headline sits right below, so the photo needs no alt text of its own. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref}
            src={src}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {source ? (
            <span className="absolute bottom-3 right-3 rounded-[6px] bg-scrim px-2 py-[3px] text-[10.5px] text-on-scrim">
              Photo: {source}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

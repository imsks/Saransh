import type { Metadata } from "next";

import { trimTrailingSlash } from "@/lib/api-base";

function withScheme(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

/** Vercel previews often set only VERCEL_URL, so it is a fallback too. */
export function getSiteUrl(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? withScheme(process.env.VERCEL_URL) : "") ||
      "http://localhost:3001",
  );
}

export const SITE_NAME = "Saransh";

export const SITE_TAGLINE = "No noise. Just news. With proof.";

export const defaultDescription =
  "Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.";

const defaultImage = () => `${getSiteUrl()}/opengraph-image`;

export function buildDefaultOg(): Metadata["openGraph"] {
  return {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: getSiteUrl(),
    images: [{ url: defaultImage(), alt: SITE_NAME }],
  };
}

export function buildDefaultTwitter(): Metadata["twitter"] {
  return { card: "summary_large_image", images: [defaultImage()] };
}

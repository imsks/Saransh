import type { Metadata } from "next";

import { buildOgImages, buildTwitterImages } from "@/lib/seo/images";

/** Canonical site origin for Open Graph, canonical URLs, and the sitemap. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  return raw.replace(/\/$/, "");
}

export const SITE_NAME = "Saransh";

export const SITE_TAGLINE = "India's news. Sourced, summarised, accountable.";

export const defaultDescription =
  "Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.";

/** Shared Open Graph defaults; pages override title and description. */
export function buildDefaultOg(): Metadata["openGraph"] {
  return {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: getSiteUrl(),
    images: buildOgImages(),
  };
}

export function buildDefaultTwitter(): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    images: buildTwitterImages(),
  };
}

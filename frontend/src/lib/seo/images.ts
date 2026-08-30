import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";

/** Route handled by `app/opengraph-image.tsx`. */
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export function getDefaultOgImageUrl(): string {
  return `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;
}

export function buildOgImages(image?: string | null, alt: string = SITE_NAME) {
  if (image?.trim()) return [{ url: image, alt }];
  return [{ url: getDefaultOgImageUrl(), alt }];
}

export function buildTwitterImages(image?: string | null): string[] {
  if (image?.trim()) return [image];
  return [getDefaultOgImageUrl()];
}

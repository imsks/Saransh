/**
 * App paths and active external links.
 */
export const ROUTES = {
  home: "/",
  stories: "/stories",
  onboarding: "/onboarding",
  contribute: "/#contribute",
  privacy: "/privacy",
} as const;

export const SHARED_STORY_PREFIX = "/s/";

/** True for a shared story link. The splash never shows on these. */
export function isSharedStoryPath(pathname: string | null | undefined): boolean {
  return !!pathname && pathname.startsWith(SHARED_STORY_PREFIX);
}

export const EXTERNAL = {
  repo: "https://github.com/imsks/Saransh",
  issues: "https://github.com/imsks/Saransh/issues",
  rajniti: "https://rajniti-app.vercel.app",
  maintainer: "https://github.com/imsks",
} as const;

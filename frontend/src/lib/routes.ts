export const ROUTES = {
  home: "/",
  stories: "/stories",
  onboarding: "/onboarding",
  contribute: "/#contribute",
  privacy: "/privacy",
} as const;

export function isSharedStoryPath(pathname: string | null | undefined): boolean {
  return pathname?.startsWith("/s/") ?? false;
}

export const EXTERNAL = {
  repo: "https://github.com/imsks/Saransh",
  issues: "https://github.com/imsks/Saransh/issues",
  rajniti: "https://rajniti-app.vercel.app",
  maintainer: "https://github.com/imsks",
} as const;

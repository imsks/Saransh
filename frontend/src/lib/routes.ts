/**
 * App paths. Keep in sync with the App Router tree and `app/sitemap.ts`.
 */
export const ROUTES = {
  home: "/",
  contributors: "/contributors",
} as const;

export const EXTERNAL = {
  repo: "https://github.com/imsks/Saransh",
  issues: "https://github.com/imsks/Saransh/issues",
  discussions: "https://github.com/imsks/Saransh/discussions",
  contributing: "https://github.com/imsks/Saransh/blob/master/CONTRIBUTING.md",
  goodFirstIssues:
    "https://github.com/imsks/Saransh/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22",
  rajniti: "https://rajniti-app.vercel.app",
  sutra: "https://github.com/imsks/sutra-ui",
} as const;

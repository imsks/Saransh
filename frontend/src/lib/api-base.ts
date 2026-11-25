const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLocalUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

/**
 * A remote API is reached through the Next.js /api/v1 rewrite, so production
 * needs no Cloud Run CORS. SSR also loops back through it when the public URL
 * is localhost, which the server cannot reach inside Docker.
 */
export function getApiBaseUrl({ forServer = typeof window === "undefined" } = {}): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;

  if (forServer) {
    if (publicUrl && !isLocalUrl(publicUrl)) return trimTrailingSlash(publicUrl);
    return `http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || "3001"}/api/v1`;
  }

  const browserUrl = publicUrl || "http://localhost:8001/api/v1";
  return isLocalUrl(browserUrl) ? trimTrailingSlash(browserUrl) : "/api/v1";
}

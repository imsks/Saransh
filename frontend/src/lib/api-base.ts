/** Strip trailing slash from a URL string. */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function isBrowserOnlyApiUrl(url: string): boolean {
  try {
    return isLocalhostHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** SSR fetch base via the Next.js /api/v1 rewrite. */
function getProxiedApiBaseUrl(): string {
  const port = process.env.PORT || "3001";
  const host = process.env.HOST || "127.0.0.1";
  return `http://${host}:${port}/api/v1`;
}

/** SSR fetch base for unversioned story routes via Next rewrites. */
export function getStoriesApiBaseUrl(options?: { forServer?: boolean }): string {
  const useServerUrl =
    options?.forServer === true ||
    (options?.forServer !== false && typeof window === "undefined");

  if (useServerUrl) {
    const port = process.env.PORT || "3001";
    const host = process.env.HOST || "127.0.0.1";
    return `http://${host}:${port}/api/stories`;
  }

  const publicBase = trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8001",
  );
  return `${publicBase}/api/stories`;
}

/**
 * Base URL for Saransh FastAPI requests.
 * Browser code uses NEXT_PUBLIC_API_URL. SSR loops back through Next rewrites
 * when the public URL points at localhost (Docker-safe).
 */
export function getApiBaseUrl(options?: { forServer?: boolean }): string {
  const useServerUrl =
    options?.forServer === true ||
    (options?.forServer !== false && typeof window === "undefined");

  if (useServerUrl) {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;

    if (publicUrl && isBrowserOnlyApiUrl(publicUrl)) {
      return getProxiedApiBaseUrl();
    }

    const explicit = process.env.API_URL || process.env.INTERNAL_API_URL;
    if (explicit) {
      return trimTrailingSlash(explicit);
    }

    if (publicUrl) {
      return trimTrailingSlash(publicUrl);
    }

    return getProxiedApiBaseUrl();
  }

  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1",
  );
}

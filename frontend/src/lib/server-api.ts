import { getApiBaseUrl } from "@/lib/api-base";

/** A question onboarding asks only when the shared `users` row lacks the answer. */
export type OnboardingField = "name" | "state" | "topics";

export interface Me {
  id: string;
  email: string;
  picture: string | null;
  name: string | null;
  state: string | null;
  topics: string[];
  coming_soon_interests: string[];
  onboarded_from: "rajniti" | "saransh" | string;
  missing_fields: OnboardingField[];
  onboarded: boolean;
}

export class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`FastAPI ${status}: ${detail}`);
  }
}

/**
 * Server-only call to FastAPI as the trusted Next.js server. The internal key is
 * not NEXT_PUBLIC, so it never reaches the browser bundle.
 */
export async function backend<T>(
  path: string,
  { userId, ...init }: RequestInit & { userId?: string } = {},
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl({ forServer: true })}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.SARANSH_INTERNAL_API_KEY ?? "",
      ...(userId ? { "X-User-Id": userId } : {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: unknown };
    throw new BackendError(response.status, String(body.detail ?? response.statusText));
  }
  return (await response.json()) as T;
}

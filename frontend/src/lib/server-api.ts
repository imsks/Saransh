import { getApiBaseUrl } from "@/lib/api-base";

export interface Question {
  key: string;
  label: string;
  kind: "single" | "multi" | "text";
  required: boolean;
  options: string[];
}

export interface Me {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  onboarded: boolean;
  questions: Question[];
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

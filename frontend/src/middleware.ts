import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/lib/routes";

/** Guests read freely; a signed-in User answers onboarding before reading. */
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (request.nextUrl.pathname === ROUTES.onboarding) {
    if (!token) return redirect(ROUTES.home);
    if (token.onboarded) return redirect(ROUTES.stories);
  } else if (token && !token.onboarded) {
    return redirect(ROUTES.onboarding);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/stories", "/onboarding"] };

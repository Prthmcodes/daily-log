import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

/** Paths anyone may reach without being signed in. */
const PUBLIC_PATHS = ["/sign-in", "/auth"];

function isPublic(pathname: string): boolean {
  // `.some()` returns true if any entry matches — the same idea as a loop with
  // an early return.
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Runs before every request. It does two jobs.
 *
 * First, it refreshes the signed-in session. Access tokens are short-lived, so
 * without this you would be silently logged out mid-use. This is also the only
 * place allowed to write the refreshed cookies, which is why the server client
 * quietly ignores cookie writes elsewhere.
 *
 * Second, it turns "not signed in" into a redirect to the sign-in page, so no
 * individual page has to remember to check.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() re-checks the token with Supabase rather than trusting whatever
  // the cookie claims. getSession() would be faster and forgeable. Do not
  // swap it. Do not put any code between creating the client and calling it,
  // or the refreshed cookies can be lost.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(request.nextUrl.pathname)) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.search = "";
    return NextResponse.redirect(signInUrl);
  }

  // Already signed in and looking at the sign-in page? Go to the app.
  if (user && request.nextUrl.pathname === "/sign-in") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /**
   * Which requests this runs on. The pattern is a "negative lookahead" — run
   * on everything EXCEPT the listed things, which are Next.js's own internal
   * files, the favicon, and image files. None of those need a session, and
   * checking one on every image would be wasted work.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

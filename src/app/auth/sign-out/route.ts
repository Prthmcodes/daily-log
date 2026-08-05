import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Sign out, then go back to the sign-in page.
 *
 * POST rather than GET on purpose. Browsers and mail clients pre-fetch GET
 * links to be helpful, which would log you out without you touching anything.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${request.nextUrl.origin}/sign-in`, {
    // A plain redirect after a POST would repeat the POST. 303 tells the
    // browser to follow it with a GET instead.
    status: 303,
  });
}

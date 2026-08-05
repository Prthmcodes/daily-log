import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Where the link in the sign-in email lands.
 *
 * Supabase can send that link in either of two shapes depending on the email
 * template, so this handles both rather than depending on a dashboard setting
 * being right:
 *
 *   token_hash — from the recommended template. Works on any device, because
 *                nothing is stored in the browser that started the sign-in.
 *   code       — from the default template. Only works in the same browser
 *                you typed your email into, which is fine on a phone.
 *
 * This is a route handler, not a page: it does a job and redirects, and never
 * renders anything.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}/`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  // Anything else — an expired link, a link already used, a link opened in a
  // different browser — sends you back to ask for a fresh one. No error
  // screen: a dead link is a mildly annoying fact, not a failure.
  return NextResponse.redirect(`${origin}/sign-in`);
}

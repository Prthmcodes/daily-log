import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";

/**
 * The Supabase client used on the server.
 *
 * It exists separately from the browser client because the two find the
 * signed-in user in different places. In the browser the session lives in
 * storage the client manages itself; on the server there is no browser, so the
 * session has to be read out of the request's cookies and written back into
 * the response's.
 *
 * `async` because Next.js hands you cookies asynchronously. `await` pauses
 * until the value arrives, the way a blocking call would in Java — the
 * difference being that the rest of the program carries on meanwhile.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Next.js forbids setting cookies while rendering a page, and
            // throws if you try. That is fine and expected here: the
            // middleware has already refreshed the session on this request,
            // so there is nothing to lose by ignoring it. This is the one
            // place in the project where an empty catch is correct, and it
            // is why it has a comment rather than being silent.
          }
        },
      },
    },
  );
}

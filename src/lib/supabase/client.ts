import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

/**
 * The Supabase client used from the browser.
 *
 * `<Database>` is a type argument — the same idea as `List<String>` in Java.
 * It tells the client what tables exist and what columns they have, so
 * `.from("dayz")` or `.eq("shwoer", true)` is a compile error rather than a
 * runtime surprise.
 *
 * There will be a second, server-side client later for checking who is signed
 * in before a page renders. It has to be built differently because the server
 * reads the session from cookies rather than from browser storage.
 */

/**
 * Read an environment variable, or fail loudly.
 *
 * Without this you get `undefined` passed silently into the client and a
 * confusing network error much later. A missing key is a setup mistake, and
 * setup mistakes should announce themselves immediately.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

// These must be written out in full rather than looked up as
// process.env[name] — Next.js replaces the exact text `process.env.FOO` at
// build time, so a dynamic lookup would find nothing in the browser.
const supabaseUrl = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

const supabaseKey = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

/**
 * Build a browser client.
 *
 * This is a function rather than a shared constant because a Next.js app runs
 * some components on the server and some in the browser, and a single shared
 * instance would leak one user's session into another's request. Calling it
 * per component is cheap — the library reuses the underlying connection.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

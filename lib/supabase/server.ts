import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

/**
 * Creates a request-scoped server client. Next.js 16 exposes cookies through
 * an async request API, so this utility must be awaited by every caller.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        void headers;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read but cannot write cookies. Route Handlers
          // and Server Actions use the same client and can persist refreshes.
        }
      },
    },
  });
}

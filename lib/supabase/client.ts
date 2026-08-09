"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient<Database> | undefined;

/** Returns the single browser client for the current page lifecycle. */
export function createClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const { url, publishableKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}

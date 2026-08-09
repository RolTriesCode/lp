import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export class SupabaseAuthenticationError extends Error {
  readonly code = "AUTHENTICATION_REQUIRED";

  constructor() {
    super("Sign in before accessing saved teaching content.");
    this.name = "SupabaseAuthenticationError";
  }
}

export type AuthenticatedSupabaseContext = {
  client: SupabaseClient<Database>;
  userId: string;
};

export async function requireAuthenticatedSupabase(): Promise<AuthenticatedSupabaseContext> {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || typeof subject !== "string" || !subject) {
    throw new SupabaseAuthenticationError();
  }

  return { client, userId: subject };
}

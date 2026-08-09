import { z } from "zod";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import {
  persistenceError,
  persistenceSuccess,
  assertTrustedMutationRequest,
  assertBoundedJsonRequest,
} from "@/lib/supabase/repositories/http";
import { importPrototypeLessons } from "@/lib/supabase/repositories/server";

const importSchema = z.object({
  lessons: z.array(z.unknown()).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request, 10 * 1024 * 1024);
    const input = importSchema.parse(await request.json());
    const { client, userId } = await requireAuthenticatedSupabase();
    const data = await importPrototypeLessons(client, userId, input.lessons);
    return persistenceSuccess(data, 201);
  } catch (error) {
    return persistenceError(error);
  }
}

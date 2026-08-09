import { z } from "zod";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import {
  createServerEntityRepository,
  PersistentEntityNameSchema,
} from "@/lib/supabase/repositories/server";
import {
  persistenceError,
  persistenceSuccess,
  assertTrustedMutationRequest,
} from "@/lib/supabase/repositories/http";

type RouteContext = { params: Promise<{ entity: string; id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    assertTrustedMutationRequest(request);
    const { entity: rawEntity, id: rawId } = await context.params;
    const entity = PersistentEntityNameSchema.parse(rawEntity);
    const id = z.string().uuid().parse(rawId);
    const { client, userId } = await requireAuthenticatedSupabase();
    const repository = createServerEntityRepository(entity, client, userId);
    const data = await repository.duplicate(id);
    return data
      ? persistenceSuccess(data, 201)
      : persistenceSuccess(null, 404);
  } catch (error) {
    return persistenceError(error);
  }
}

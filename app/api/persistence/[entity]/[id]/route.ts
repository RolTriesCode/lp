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
  assertBoundedJsonRequest,
} from "@/lib/supabase/repositories/http";

const idSchema = z.string().uuid();
const statusSchema = z.enum(["draft", "ready", "archived", "error"]);
const updateSchema = z.object({
  value: z.unknown(),
  expectedRevision: z.number().int().positive(),
  status: statusSchema.optional(),
});

type RouteContext = { params: Promise<{ entity: string; id: string }> };

async function getRepository(context: RouteContext) {
  const { entity: rawEntity, id: rawId } = await context.params;
  const entity = PersistentEntityNameSchema.parse(rawEntity);
  const id = idSchema.parse(rawId);
  const { client, userId } = await requireAuthenticatedSupabase();
  return { id, repository: createServerEntityRepository(entity, client, userId) };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id, repository } = await getRepository(context);
    const data = await repository.get(id);
    return data
      ? persistenceSuccess(data)
      : persistenceSuccess(null, 404);
  } catch (error) {
    return persistenceError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request);
    const input = updateSchema.parse(await request.json());
    const { id, repository } = await getRepository(context);
    const data = await repository.update(
      id,
      input.value,
      input.expectedRevision,
      input.status
    );
    return data
      ? persistenceSuccess(data)
      : persistenceSuccess(null, 404);
  } catch (error) {
    return persistenceError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    assertTrustedMutationRequest(request);
    const { id, repository } = await getRepository(context);
    await repository.delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return persistenceError(error);
  }
}

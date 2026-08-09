import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import {
  assertBoundedJsonRequest,
  assertTrustedMutationRequest,
  persistenceError,
  persistenceSuccess,
} from "@/lib/supabase/repositories/http";
import { ScheduleEntryInputSchema } from "@/schemas/schedule";
import { ScheduleConflictError, SupabaseScheduleRepository } from "@/lib/schedule/server";

const updateSchema = z.object({
  value: ScheduleEntryInputSchema,
  expectedRevision: z.number().int().positive(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function repositoryAndId(context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = z.uuid().parse(rawId);
  const { client, userId } = await requireAuthenticatedSupabase();
  return { id, repository: new SupabaseScheduleRepository(client, userId) };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request, 32 * 1024);
    const input = updateSchema.parse(await request.json());
    const { id, repository } = await repositoryAndId(context);
    const data = await repository.update(id, input.value, input.expectedRevision);
    return data ? persistenceSuccess(data) : persistenceSuccess(null, 404);
  } catch (error) {
    if (error instanceof ScheduleConflictError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message, remote: error.remote } },
        { status: 409, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    return persistenceError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    assertTrustedMutationRequest(request);
    const { id, repository } = await repositoryAndId(context);
    await repository.delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return persistenceError(error);
  }
}

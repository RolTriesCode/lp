import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import {
  assertBoundedJsonRequest,
  assertTrustedMutationRequest,
  persistenceError,
  persistenceSuccess,
} from "@/lib/supabase/repositories/http";
import {
  ClassroomContextConflictError,
  SupabaseClassroomContextRepository,
} from "@/lib/classroom-context/server";
import { ClassroomContextApplicationSchema } from "@/schemas/classroom-context";

const updateSchema = z.object({
  value: ClassroomContextApplicationSchema,
  expectedRevision: z.number().int().positive().nullable(),
});

function envelope(record: Awaited<ReturnType<SupabaseClassroomContextRepository["get"]>>, repository: SupabaseClassroomContextRepository) {
  return record
    ? { value: ClassroomContextApplicationSchema.parse(record), revision: record.revision, updatedAt: record.updatedAt }
    : { value: repository.defaults(), revision: null, updatedAt: null };
}

export async function GET() {
  try {
    const { client, userId } = await requireAuthenticatedSupabase();
    const repository = new SupabaseClassroomContextRepository(client, userId);
    return persistenceSuccess(envelope(await repository.get(), repository));
  } catch (error) {
    return persistenceError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request, 16 * 1024);
    const input = updateSchema.parse(await request.json());
    const { client, userId } = await requireAuthenticatedSupabase();
    const repository = new SupabaseClassroomContextRepository(client, userId);
    const record = await repository.save(input.value, input.expectedRevision);
    return persistenceSuccess(envelope(record, repository));
  } catch (error) {
    if (error instanceof ClassroomContextConflictError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            remote: {
              value: ClassroomContextApplicationSchema.parse(error.remote),
              revision: error.remote.revision,
              updatedAt: error.remote.updatedAt,
            },
          },
        },
        { status: 409, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    return persistenceError(error);
  }
}

import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import type { PersistenceStatus } from "@/lib/persistence/types";
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

const statusSchema = z.enum(["draft", "ready", "archived", "error"]);
const createSchema = z.object({
  value: z.unknown(),
  status: statusSchema.optional(),
});

type RouteContext = { params: Promise<{ entity: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { entity: rawEntity } = await context.params;
    const entity = PersistentEntityNameSchema.parse(rawEntity);
    const { client, userId } = await requireAuthenticatedSupabase();
    const repository = createServerEntityRepository(entity, client, userId);
    const statusValue = request.nextUrl.searchParams.get("status");
    const rawLessonPlanId = request.nextUrl.searchParams.get("lessonPlanId");
    const lessonPlanId = rawLessonPlanId
      ? z.string().uuid().parse(rawLessonPlanId)
      : undefined;
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
    const status = statusValue ? statusSchema.parse(statusValue) : undefined;
    const data = await repository.list({
      status: status as PersistenceStatus | undefined,
      lessonPlanId,
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : 0,
    });
    return persistenceSuccess(data);
  } catch (error) {
    return persistenceError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request);
    const { entity: rawEntity } = await context.params;
    const entity = PersistentEntityNameSchema.parse(rawEntity);
    const input = createSchema.parse(await request.json());
    const { client, userId } = await requireAuthenticatedSupabase();
    const repository = createServerEntityRepository(entity, client, userId);
    const data = await repository.create(input.value, input.status);
    return persistenceSuccess(data, 201);
  } catch (error) {
    return persistenceError(error);
  }
}

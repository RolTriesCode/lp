import { type NextRequest } from "next/server";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import {
  assertBoundedJsonRequest,
  assertTrustedMutationRequest,
  persistenceError,
  persistenceSuccess,
} from "@/lib/supabase/repositories/http";
import { ScheduleEntryInputSchema } from "@/schemas/schedule";
import { ScheduleListQuerySchema, SupabaseScheduleRepository } from "@/lib/schedule/server";

export async function GET(request: NextRequest) {
  try {
    const query = ScheduleListQuerySchema.parse({
      start: request.nextUrl.searchParams.get("start"),
      end: request.nextUrl.searchParams.get("end"),
      kind: request.nextUrl.searchParams.get("kind") || undefined,
      status: request.nextUrl.searchParams.get("status") || undefined,
    });
    const { client, userId } = await requireAuthenticatedSupabase();
    const data = await new SupabaseScheduleRepository(client, userId).list(query);
    return persistenceSuccess(data);
  } catch (error) {
    return persistenceError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request, 32 * 1024);
    const input = ScheduleEntryInputSchema.parse(await request.json());
    const { client, userId } = await requireAuthenticatedSupabase();
    const data = await new SupabaseScheduleRepository(client, userId).create(input);
    return persistenceSuccess(data, 201);
  } catch (error) {
    return persistenceError(error);
  }
}


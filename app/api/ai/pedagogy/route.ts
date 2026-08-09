import { NextResponse } from "next/server";
import { suggestDifferentiation } from "@/lib/ai/pedagogy-suggestions";
import { requireAuthenticatedSupabase, SupabaseAuthenticationError } from "@/lib/supabase/auth";
import { assertBoundedJsonRequest, assertTrustedMutationRequest } from "@/lib/supabase/repositories/http";

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    assertBoundedJsonRequest(request, 512 * 1024);
    await requireAuthenticatedSupabase();
    const result = await suggestDifferentiation(await request.json().catch(() => ({})));
    if (result.success) return NextResponse.json(result, { status: 200 });
    const status = result.error.category === "INVALID_REQUEST" ? 400
      : result.error.category === "RATE_LIMIT" ? 429
        : result.error.category === "MISSING_API_KEY" ? 503
          : 500;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      return NextResponse.json(
        { success: false, error: { category: error.code, message: error.message, retryable: false } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: { category: "INVALID_REQUEST", message: error instanceof Error ? error.message : "Invalid pedagogy request.", retryable: false } },
      { status: 400 }
    );
  }
}

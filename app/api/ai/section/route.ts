import { NextResponse } from "next/server";
import { generateCorrelationId } from "@/lib/ai/generate-lesson";
import { rewriteLessonSection } from "@/lib/ai/rewrite-section";

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();

  try {
    const body = await request.json().catch(() => ({}));
    const result = await rewriteLessonSection(body);

    if (result.success) {
      return NextResponse.json({ ...result, correlationId }, { status: 200 });
    }

    const category = result.error.category;
    let status = 500;

    if (category === "INVALID_REQUEST" || category === "SAFETY_REJECTION") {
      status = 400;
    } else if (category === "RATE_LIMIT") {
      status = 429;
    } else if (category === "MISSING_API_KEY") {
      status = 503;
    }

    return NextResponse.json({ ...result, correlationId }, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        correlationId,
        error: {
          category: "UPSTREAM_FAILURE",
          message: `Section action API handler error: ${message}`,
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

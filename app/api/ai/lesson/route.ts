import { NextResponse } from "next/server";
import { generateCorrelationId, generateLesson } from "@/lib/ai/generate-lesson";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();

  try {
    const body = await request.json().catch(() => ({}));
    const result = await generateLesson(body, correlationId);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
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

    return NextResponse.json(result, { status });
  } catch (err) {
    captureMonitoringException(err, { area: "lesson_generation", category: "UPSTREAM_FAILURE" });
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        correlationId,
        error: {
          category: "UPSTREAM_FAILURE",
          message: `API Handler error: ${message}`,
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

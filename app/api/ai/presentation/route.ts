import { NextResponse } from "next/server";
import { generateCorrelationId } from "@/lib/ai/generate-lesson";
import { generatePresentation } from "@/lib/ai/generate-presentation";

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();

  try {
    const body = await request.json().catch(() => ({}));
    const { lessonPlan, theme } = body;

    if (!lessonPlan || !theme) {
      return NextResponse.json(
        {
          success: false,
          correlationId,
          error: {
            category: "INVALID_REQUEST",
            message: "Missing required lessonPlan or theme payload.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const result = await generatePresentation({ lessonPlan, theme });

    return NextResponse.json({ ...result, correlationId }, { status: 200 });
  } catch (err: any) {
    const category = err.category || "UPSTREAM_FAILURE";
    let status = 500;

    if (category === "INVALID_REQUEST" || category === "SAFETY_REJECTION") {
      status = 400;
    } else if (category === "RATE_LIMIT") {
      status = 429;
    } else if (category === "MISSING_API_KEY") {
      status = 503;
    }

    return NextResponse.json(
      {
        success: false,
        correlationId,
        error: {
          category,
          message: err.message || "Failed to generate presentation slides.",
          retryable: err.retryable ?? true,
        },
      },
      { status }
    );
  }
}

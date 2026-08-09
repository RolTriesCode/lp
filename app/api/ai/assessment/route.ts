import { NextResponse } from "next/server";
import { generateCorrelationId } from "@/lib/ai/generate-lesson";
import { generateAssessment } from "@/lib/ai/generate-assessment";

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();

  try {
    const body = await request.json().catch(() => ({}));
    const { lesson, itemTypes, difficulty, itemCount, additionalInstructions } = body;

    if (!lesson || !itemTypes || !difficulty || !itemCount) {
      return NextResponse.json(
        {
          success: false,
          correlationId,
          error: {
            category: "INVALID_REQUEST",
            message: "Missing required lesson, itemTypes, difficulty, or itemCount parameters.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const result = await generateAssessment({
      lesson,
      itemTypes,
      difficulty,
      itemCount,
      additionalInstructions,
    });

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
          message: err.message || "Failed to generate assessment items.",
          retryable: err.retryable ?? true,
        },
      },
      { status }
    );
  }
}

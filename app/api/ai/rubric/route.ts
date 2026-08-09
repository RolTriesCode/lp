import { NextResponse } from "next/server";
import { generateCorrelationId } from "@/lib/ai/generate-lesson";
import { generateRubric } from "@/lib/ai/generate-rubric";

export async function POST(request: Request) {
  const correlationId = generateCorrelationId();

  try {
    const body = await request.json().catch(() => ({}));
    const { lesson, taskDescription, scaleLevels } = body;

    if (!lesson || !taskDescription || !scaleLevels) {
      return NextResponse.json(
        {
          success: false,
          correlationId,
          error: {
            category: "INVALID_REQUEST",
            message: "Missing required lesson, taskDescription, or scaleLevels parameters.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const result = await generateRubric({
      lesson,
      taskDescription,
      scaleLevels,
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
          message: err.message || "Failed to generate rubric items.",
          retryable: err.retryable ?? true,
        },
      },
      { status }
    );
  }
}

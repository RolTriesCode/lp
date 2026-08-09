import { NextResponse } from "next/server";
import { generateDocxFile } from "@/lib/documents/docx/renderer";
import { safeParseLessonPlan } from "@/schemas/lesson";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = safeParseLessonPlan(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            category: "INVALID_REQUEST",
            message: "Invalid lesson plan schema payload. Verification failed.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const docxBuffer = await generateDocxFile(parsed.data);

    // Create safe clean filename
    const cleanTitle = parsed.data.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "lesson_plan";

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${cleanTitle}.docx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          category: "UPSTREAM_FAILURE",
          message: err.message || "Failed to generate Word DOCX document stream.",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

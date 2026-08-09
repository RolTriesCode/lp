import { NextResponse } from "next/server";
import { generatePdfFile } from "@/lib/documents/pdf/renderer";
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

    const pdfBuffer = await generatePdfFile(parsed.data);

    // Create safe clean filename
    const cleanTitle = parsed.data.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "lesson_plan";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanTitle}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          category: "UPSTREAM_FAILURE",
          message: err.message || "Failed to generate PDF document stream.",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

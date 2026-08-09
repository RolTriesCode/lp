import { NextResponse } from "next/server";
import { generatePdfFile } from "@/lib/documents/pdf/renderer";
import { LessonExportRequestSchema } from "@/schemas/lesson-export";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = LessonExportRequestSchema.safeParse(body);

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

    const pdfBuffer = await generatePdfFile(parsed.data.lesson, {
      includePrivateNotes: parsed.data.includePrivateNotes,
    });

    // Create safe clean filename
    const cleanTitle = parsed.data.lesson.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "lesson_plan";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanTitle}.pdf"`,
      },
    });
  } catch (err: unknown) {
    captureMonitoringException(err, { area: "lesson_export", category: "UPSTREAM_FAILURE" });
    const message = err instanceof Error ? err.message : "Failed to generate PDF document stream.";
    return NextResponse.json(
      {
        success: false,
        error: {
          category: "UPSTREAM_FAILURE",
          message,
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

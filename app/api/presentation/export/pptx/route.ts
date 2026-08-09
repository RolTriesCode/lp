import { NextResponse } from "next/server";
import { generatePptxFile } from "@/lib/documents/pptx/renderer";
import { safeParsePresentation } from "@/schemas/presentation";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = safeParsePresentation(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            category: "INVALID_REQUEST",
            message: "Invalid presentation schema payload. Verification failed.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const pptxBuffer = await generatePptxFile(parsed.data);

    // Create safe clean filename
    const cleanTitle = parsed.data.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "presentation";

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${cleanTitle}.pptx"`,
      },
    });
  } catch (err: unknown) {
    captureMonitoringException(err, { area: "presentation_export", category: "UPSTREAM_FAILURE" });
    const message = err instanceof Error ? err.message : "Failed to generate PPTX document stream.";
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

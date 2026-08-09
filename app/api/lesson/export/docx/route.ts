import { NextResponse } from "next/server";
import { generateDocxFile } from "@/lib/documents/docx/renderer";
import { requireAuthenticatedSupabase, SupabaseAuthenticationError } from "@/lib/supabase/auth";
import { getTeacherProfile } from "@/lib/profile/repository";
import { LessonExportRequestSchema } from "@/schemas/lesson-export";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedSupabase();
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

    const profile = await getTeacherProfile(auth);
    const docxBuffer = await generateDocxFile(parsed.data.lesson, {
      teacherName: profile.displayName,
      schoolName: profile.schoolName,
      roleTitle: profile.roleTitle,
    }, { includePrivateNotes: parsed.data.includePrivateNotes });

    // Create safe clean filename
    const cleanTitle = parsed.data.lesson.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "lesson_plan";

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${cleanTitle}.docx"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof SupabaseAuthenticationError) {
      return NextResponse.json(
        { success: false, error: { category: "UNAUTHORIZED", message: error.message, retryable: false } },
        { status: 401 }
      );
    }
    captureMonitoringException(error, { area: "lesson_export", category: "UPSTREAM_FAILURE" });
    const message = error instanceof Error ? error.message : "Failed to generate Word DOCX document stream.";
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

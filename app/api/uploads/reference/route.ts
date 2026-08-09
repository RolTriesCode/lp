import { NextResponse } from "next/server";
import { processReferenceUpload } from "@/lib/documents/import/ingest";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            category: "INVALID_REQUEST",
            message: "Missing uploaded file field in request payload.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const refDoc = await processReferenceUpload(buffer, file.name, file.type || "");

    return NextResponse.json(
      {
        success: true,
        data: refDoc,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          category: "INVALID_REQUEST",
          message: err.message || "Failed to process reference document upload.",
          retryable: false,
        },
      },
      { status: 400 }
    );
  }
}

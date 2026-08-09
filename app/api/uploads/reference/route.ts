import { NextResponse } from "next/server";
import {
  processReferenceUpload,
  ReferenceUploadError,
} from "@/lib/documents/import/ingest.server";
import { MAX_REFERENCE_FILE_BYTES } from "@/schemas/reference";
import { toUploadedReference } from "@/schemas/resource";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import { SupabaseAuthenticationError } from "@/lib/supabase/auth";
import {
  createUploadedResourceWithFile,
  SupabaseRepositoryError,
} from "@/lib/supabase/repositories/server";
import {
  assertTrustedMutationRequest,
  PersistenceAccessError,
  persistenceError,
} from "@/lib/supabase/repositories/http";

export const runtime = "nodejs";

const MAX_MULTIPART_REQUEST_BYTES = MAX_REFERENCE_FILE_BYTES + 256 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_REQUEST_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          category: "FILE_TOO_LARGE",
          message: "This upload is larger than 10 MB. Choose a smaller DOCX or PDF.",
          retryable: false,
        },
      },
      { status: 413 }
    );
  }

  try {
    assertTrustedMutationRequest(request);
    const { client, userId } = await requireAuthenticatedSupabase();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ReferenceUploadError(
        "INVALID_FILE",
        "Choose a DOCX or PDF file before uploading."
      );
    }

    if (file.size > MAX_REFERENCE_FILE_BYTES) {
      throw new ReferenceUploadError(
        "FILE_TOO_LARGE",
        "This file is larger than 10 MB. Choose a smaller DOCX or PDF.",
        413
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const reference = await processReferenceUpload(
      bytes,
      file.name,
      file.type
    );
    const persisted = await createUploadedResourceWithFile(
      client,
      userId,
      reference,
      bytes
    );

    return NextResponse.json(
      { success: true, data: toUploadedReference(persisted.value) },
      { status: 201, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    if (error instanceof PersistenceAccessError) return persistenceError(error);
    if (error instanceof SupabaseAuthenticationError) {
      return NextResponse.json(
        { success: false, error: { category: error.code, message: error.message, retryable: false } },
        { status: 401 }
      );
    }
    if (error instanceof SupabaseRepositoryError) {
      return NextResponse.json(
        { success: false, error: { category: error.code, message: error.message, retryable: true } },
        { status: 503 }
      );
    }
    const uploadError =
      error instanceof ReferenceUploadError
        ? error
        : new ReferenceUploadError(
            "INVALID_FILE",
            "The upload could not be read. Choose a DOCX or PDF file and try again."
          );

    return NextResponse.json(
      {
        success: false,
        error: {
          category: uploadError.code,
          message: uploadError.message,
          retryable: false,
        },
      },
      { status: uploadError.status }
    );
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SupabaseAuthenticationError } from "@/lib/supabase/auth";
import {
  SupabaseRepositoryConflictError,
  SupabaseRepositoryError,
} from "@/lib/supabase/repositories/server";

export class PersistenceAccessError extends Error {
  readonly code = "UNTRUSTED_MUTATION_ORIGIN";

  constructor() {
    super("This save request did not originate from the application.");
    this.name = "PersistenceAccessError";
  }
}

export class PersistencePayloadTooLargeError extends Error {
  readonly code = "PERSISTENCE_PAYLOAD_TOO_LARGE";

  constructor() {
    super("This save request is too large. Reduce the content and try again.");
    this.name = "PersistencePayloadTooLargeError";
  }
}

export function assertBoundedJsonRequest(
  request: Request,
  maximumBytes: number = 2 * 1024 * 1024
): void {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new PersistencePayloadTooLargeError();
  }
}

export function assertTrustedMutationRequest(request: Request): void {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new PersistenceAccessError();

  const origin = request.headers.get("origin");
  if (!origin) return;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || request.headers.get("host");
  try {
    if (!requestHost || new URL(origin).host !== requestHost) {
      throw new PersistenceAccessError();
    }
  } catch (error) {
    if (error instanceof PersistenceAccessError) throw error;
    throw new PersistenceAccessError();
  }
}

export function persistenceSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true as const, data },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}

export function persistenceError(error: unknown) {
  if (error instanceof PersistencePayloadTooLargeError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 413 }
    );
  }
  if (error instanceof PersistenceAccessError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 403 }
    );
  }
  if (error instanceof SupabaseAuthenticationError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 401 }
    );
  }
  if (error instanceof SupabaseRepositoryConflictError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          remote: error.remote,
        },
      },
      { status: 409 }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PERSISTENCE_PAYLOAD",
          message: "The saved content does not match its canonical schema.",
          issues: error.issues,
        },
      },
      { status: 422 }
    );
  }
  if (error instanceof SupabaseRepositoryError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "PERSISTENCE_UNAVAILABLE",
        message: "Saved content is temporarily unavailable. Your open work was not discarded.",
      },
    },
    { status: 503 }
  );
}

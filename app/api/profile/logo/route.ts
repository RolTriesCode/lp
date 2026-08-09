import { NextResponse } from "next/server";
import { requireAuthenticatedSupabase, SupabaseAuthenticationError } from "@/lib/supabase/auth";
import { getTeacherProfile, updateSchoolLogoPath } from "@/lib/profile/repository";
import {
  detectSchoolLogoMime,
  MAX_SCHOOL_LOGO_BYTES,
  schoolLogoExtension,
} from "@/lib/profile/logo";

const BUCKET = "school-logos";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function GET() {
  try {
    const auth = await requireAuthenticatedSupabase();
    const profile = await getTeacherProfile(auth);
    if (!profile.schoolLogoPath) return errorResponse("No school logo is saved.", 404);

    const { data, error } = await auth.client.storage.from(BUCKET).download(profile.schoolLogoPath);
    if (error || !data) return errorResponse("The school logo could not be loaded.", 404);

    return new NextResponse(data, {
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(
      error instanceof SupabaseAuthenticationError ? error.message : "The school logo could not be loaded.",
      error instanceof SupabaseAuthenticationError ? 401 : 500
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedSupabase();
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SCHOOL_LOGO_BYTES + 256_000) {
      return errorResponse("The school logo is larger than 5 MB. Choose a smaller image.", 413);
    }

    const formData = await request.formData();
    const file = formData.get("logo");
    if (!(file instanceof File) || file.size === 0) return errorResponse("Choose a PNG, JPEG, or WebP logo.", 400);
    if (file.size > MAX_SCHOOL_LOGO_BYTES) return errorResponse("The school logo is larger than 5 MB. Choose a smaller image.", 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detectedMime = detectSchoolLogoMime(bytes);
    if (!detectedMime || file.type !== detectedMime) {
      return errorResponse("This file is not a valid PNG, JPEG, or WebP image.", 415);
    }

    const current = await getTeacherProfile(auth);
    const path = `${auth.userId}/${crypto.randomUUID()}.${schoolLogoExtension(detectedMime)}`;
    const { error: uploadError } = await auth.client.storage.from(BUCKET).upload(path, bytes, {
      contentType: detectedMime,
      cacheControl: "300",
      upsert: false,
    });
    if (uploadError) return errorResponse("The school logo could not be uploaded. Try again.", 502);

    try {
      await updateSchoolLogoPath(path, auth);
    } catch (error) {
      await auth.client.storage.from(BUCKET).remove([path]);
      throw error;
    }

    if (current.schoolLogoPath && current.schoolLogoPath !== path) {
      await auth.client.storage.from(BUCKET).remove([current.schoolLogoPath]);
    }

    return NextResponse.json({ success: true, data: { updatedAt: new Date().toISOString() } });
  } catch (error) {
    return errorResponse(
      error instanceof SupabaseAuthenticationError ? error.message : "The school logo could not be saved.",
      error instanceof SupabaseAuthenticationError ? 401 : 500
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuthenticatedSupabase();
    const current = await getTeacherProfile(auth);
    if (!current.schoolLogoPath) return NextResponse.json({ success: true });

    await updateSchoolLogoPath(null, auth);
    const { error: removeError } = await auth.client.storage.from(BUCKET).remove([current.schoolLogoPath]);
    if (removeError) {
      await updateSchoolLogoPath(current.schoolLogoPath, auth);
      return errorResponse("The saved school logo could not be removed. Try again.", 502);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof SupabaseAuthenticationError ? error.message : "The school logo could not be removed.",
      error instanceof SupabaseAuthenticationError ? 401 : 500
    );
  }
}

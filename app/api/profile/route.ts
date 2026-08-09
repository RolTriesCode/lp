import { NextResponse } from "next/server";
import { requireAuthenticatedSupabase, SupabaseAuthenticationError } from "@/lib/supabase/auth";
import { getTeacherProfile } from "@/lib/profile/repository";

export async function GET() {
  try {
    const auth = await requireAuthenticatedSupabase();
    const profile = await getTeacherProfile(auth);
    return NextResponse.json({
      success: true,
      data: {
        displayName: profile.displayName,
        schoolName: profile.schoolName,
        roleTitle: profile.roleTitle,
        schoolLogoPath: profile.schoolLogoPath,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    const unauthorized = error instanceof SupabaseAuthenticationError;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: unauthorized ? error.message : "Your profile could not be loaded.",
        },
      },
      { status: unauthorized ? 401 : 500 }
    );
  }
}

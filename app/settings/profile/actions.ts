"use server";

import { revalidatePath } from "next/cache";
import { updateTeacherProfile } from "@/lib/profile/repository";
import { TeacherProfileInputSchema } from "@/schemas/profile";

export type ProfileActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = TeacherProfileInputSchema.safeParse({
    displayName: formData.get("displayName"),
    schoolName: formData.get("schoolName"),
    roleTitle: formData.get("roleTitle"),
    preferredGradeLevel: formData.get("preferredGradeLevel"),
    preferredSubjects: formData.getAll("preferredSubjects"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted profile fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateTeacherProfile(parsed.data);
    revalidatePath("/", "layout");
    return { status: "success", message: "Your teacher profile has been saved." };
  } catch {
    return {
      status: "error",
      message: "Your profile could not be saved. Check your connection and try again.",
    };
  }
}

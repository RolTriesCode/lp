"use server";

import { revalidatePath } from "next/cache";
import { updateTeacherPreferences } from "@/lib/profile/repository";
import { TeacherPreferencesSchema } from "@/schemas/profile";

export type PreferencesActionState = {
  status?: "success" | "error";
  message?: string;
};

export async function updatePreferencesAction(
  _state: PreferencesActionState,
  formData: FormData
): Promise<PreferencesActionState> {
  const parsed = TeacherPreferencesSchema.safeParse({
    defaultCurriculum: formData.get("defaultCurriculum"),
    defaultLessonType: formData.get("defaultLessonType"),
    defaultDuration: formData.get("defaultDuration"),
    defaultLanguage: formData.get("defaultLanguage"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Review the selected defaults and try again." };
  }

  try {
    await updateTeacherPreferences(parsed.data);
    revalidatePath("/settings/preferences");
    revalidatePath("/lesson/create");
    return { status: "success", message: "Lesson creation defaults saved." };
  } catch {
    return { status: "error", message: "Preferences could not be saved. Check your connection and try again." };
  }
}

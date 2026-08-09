import "server-only";

import type { AuthenticatedSupabaseContext } from "@/lib/supabase/auth";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import type { Tables } from "@/lib/supabase/database.types";
import {
  TeacherProfileInputSchema,
  TeacherPreferencesSchema,
  TeacherProfileSchema,
  type TeacherPreferences,
  type TeacherProfile,
  type TeacherProfileInput,
} from "@/schemas/profile";

function fromRow(row: Tables<"profiles">): TeacherProfile {
  return TeacherProfileSchema.parse({
    id: row.id,
    displayName: row.display_name ?? "Teacher",
    schoolName: row.school_name,
    roleTitle: row.role_title,
    preferredGradeLevel: row.preferred_grade_level,
    preferredSubjects: row.preferred_subjects,
    schoolLogoPath: row.school_logo_path,
    status: row.status,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function getTeacherProfile(
  context?: AuthenticatedSupabaseContext
): Promise<TeacherProfile> {
  const auth = context ?? (await requireAuthenticatedSupabase());
  const { data, error } = await auth.client
    .from("profiles")
    .select("*")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) throw new Error(`Teacher profile could not be loaded. ${error.message}`);
  if (data) return fromRow(data);

  const { data: created, error: createError } = await auth.client
    .from("profiles")
    .insert({ id: auth.userId })
    .select("*")
    .single();

  if (createError) throw new Error(`Teacher profile could not be created. ${createError.message}`);
  return fromRow(created);
}

export async function updateTeacherProfile(
  input: TeacherProfileInput,
  context?: AuthenticatedSupabaseContext
): Promise<TeacherProfile> {
  const auth = context ?? (await requireAuthenticatedSupabase());
  const value = TeacherProfileInputSchema.parse(input);
  const { data, error } = await auth.client
    .from("profiles")
    .update({
      display_name: value.displayName,
      school_name: value.schoolName,
      role_title: value.roleTitle,
      preferred_grade_level: value.preferredGradeLevel,
      preferred_subjects: value.preferredSubjects,
    })
    .eq("id", auth.userId)
    .select("*")
    .single();

  if (error) throw new Error(`Teacher profile could not be updated. ${error.message}`);
  return fromRow(data);
}

export async function updateSchoolLogoPath(
  schoolLogoPath: string | null,
  context?: AuthenticatedSupabaseContext
): Promise<TeacherProfile> {
  const auth = context ?? (await requireAuthenticatedSupabase());
  if (schoolLogoPath !== null && !schoolLogoPath.startsWith(`${auth.userId}/`)) {
    throw new Error("School logo ownership could not be verified.");
  }

  const { data, error } = await auth.client
    .from("profiles")
    .update({ school_logo_path: schoolLogoPath })
    .eq("id", auth.userId)
    .select("*")
    .single();

  if (error) throw new Error(`School logo could not be updated. ${error.message}`);
  return fromRow(data);
}

export async function getTeacherPreferences(
  context?: AuthenticatedSupabaseContext
): Promise<TeacherPreferences> {
  const auth = context ?? (await requireAuthenticatedSupabase());
  const { data, error } = await auth.client
    .from("profiles")
    .select("preferences")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) throw new Error(`Teacher preferences could not be loaded. ${error.message}`);
  return TeacherPreferencesSchema.parse(data?.preferences ?? {});
}

export async function updateTeacherPreferences(
  input: TeacherPreferences,
  context?: AuthenticatedSupabaseContext
): Promise<TeacherPreferences> {
  const auth = context ?? (await requireAuthenticatedSupabase());
  const value = TeacherPreferencesSchema.parse(input);
  const { error } = await auth.client
    .from("profiles")
    .update({ preferences: value })
    .eq("id", auth.userId);

  if (error) throw new Error(`Teacher preferences could not be updated. ${error.message}`);
  return value;
}

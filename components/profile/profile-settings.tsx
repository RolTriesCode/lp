"use client";

import { ImagePlus, Loader2, Save, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/settings/profile/actions";
import type { TeacherProfile } from "@/schemas/profile";

const SUBJECTS = ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "GMRC / EsP", "MAPEH", "TLE"];
const GRADES = ["Kindergarten", ...Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`), "Multiple grade levels"];
const ROLES = ["Teacher", "Master Teacher", "Head Teacher", "School Head", "Learning Area Coordinator"];

type LogoState = { status: "idle" | "working" | "success" | "error"; message?: string };

export function ProfileSettings({ profile }: { profile: TeacherProfile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(updateProfileAction, {});
  const [logoState, setLogoState] = useState<LogoState>({ status: "idle" });

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  async function uploadLogo() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setLogoState({ status: "error", message: "Choose a logo image first." });
    setLogoState({ status: "working", message: "Uploading your school logo…" });
    const body = new FormData();
    body.set("logo", file);
    try {
      const response = await fetch("/api/profile/logo", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "Upload failed.");
      setLogoState({ status: "success", message: "School logo saved." });
      router.refresh();
    } catch (error) {
      setLogoState({ status: "error", message: error instanceof Error ? error.message : "The school logo could not be uploaded." });
    }
  }

  async function removeLogo() {
    setLogoState({ status: "working", message: "Removing your school logo…" });
    try {
      const response = await fetch("/api/profile/logo", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || "Removal failed.");
      if (fileRef.current) fileRef.current.value = "";
      setLogoState({ status: "success", message: "School logo removed." });
      router.refresh();
    } catch (error) {
      setLogoState({ status: "error", message: error instanceof Error ? error.message : "The school logo could not be removed." });
    }
  }

  return (
    <div className="profile-settings-page">
      <header className="profile-page-heading"><div><h1>School &amp; Profile</h1><p>Use these details across your private workspace and exported lesson plans.</p></div><span>Private to your account</span></header>

      <div className="profile-settings-layout">
        <form action={action} className="profile-form panel" noValidate>
          <div className="profile-section-heading"><h2>Teacher details</h2><p>Names and school details appear in your header and Word exports.</p></div>
          <div className="profile-field-grid">
            <label><span>Display name</span><input defaultValue={profile.displayName} maxLength={120} name="displayName" required />{state.fieldErrors?.displayName ? <small className="profile-error">{state.fieldErrors.displayName[0]}</small> : null}</label>
            <label><span>School</span><input defaultValue={profile.schoolName ?? ""} maxLength={180} name="schoolName" placeholder="Optional school name" /></label>
            <label><span>Role</span><select defaultValue={profile.roleTitle} name="roleTitle">{ROLES.map((role) => <option key={role}>{role}</option>)}</select><small>This is a profile label, not an access permission.</small></label>
            <label><span>Preferred grade</span><select defaultValue={profile.preferredGradeLevel ?? ""} name="preferredGradeLevel"><option value="">No default grade</option>{GRADES.map((grade) => <option key={grade}>{grade}</option>)}</select></label>
          </div>
          <fieldset className="profile-subjects"><legend>Preferred subjects</legend><p>Choose the learning areas you use most often.</p><div>{SUBJECTS.map((subject) => <label key={subject}><input defaultChecked={profile.preferredSubjects.includes(subject)} name="preferredSubjects" type="checkbox" value={subject} /><span>{subject}</span></label>)}</div></fieldset>
          {state.message ? <div className={`profile-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</div> : null}
          <button className="profile-save" disabled={pending} type="submit">{pending ? <Loader2 className="profile-spinner" aria-hidden="true" /> : <Save aria-hidden="true" />} {pending ? "Saving profile…" : "Save profile"}</button>
        </form>

        <aside className="profile-logo panel">
          <div className="profile-section-heading"><h2>School logo</h2><p>Optional. PNG, JPEG, or WebP up to 5 MB.</p></div>
          <div className="profile-logo-preview">{profile.schoolLogoPath ? <Image alt={`${profile.schoolName || "School"} logo`} height={180} src={`/api/profile/logo?v=${encodeURIComponent(profile.updatedAt)}`} unoptimized width={272} /> : <ImagePlus aria-hidden="true" />}</div>
          <label className="profile-file"><span>Choose logo image</span><input accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" ref={fileRef} type="file" /></label>
          <div className="profile-logo-actions"><button disabled={logoState.status === "working"} onClick={uploadLogo} type="button"><UploadCloud aria-hidden="true" /> Upload logo</button>{profile.schoolLogoPath ? <button className="remove" disabled={logoState.status === "working"} onClick={removeLogo} type="button"><Trash2 aria-hidden="true" /> Remove</button> : null}</div>
          {logoState.message ? <div className={`profile-message ${logoState.status}`} role={logoState.status === "error" ? "alert" : "status"}>{logoState.message}</div> : null}
        </aside>
      </div>
    </div>
  );
}

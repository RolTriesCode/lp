"use client";

import { BookOpenCheck, Loader2, Save } from "lucide-react";
import { useActionState } from "react";
import { updatePreferencesAction, type PreferencesActionState } from "@/app/settings/preferences/actions";
import {
  curriculumOptions,
  durationOptions,
  languageOptions,
  lessonTypeOptions,
} from "@/lib/lesson-plan-schema";
import type { TeacherPreferences } from "@/schemas/profile";

export function PreferenceSettings({ preferences }: { preferences: TeacherPreferences }) {
  const [state, action, pending] = useActionState<PreferencesActionState, FormData>(
    updatePreferencesAction,
    {}
  );

  return (
    <div className="profile-settings-page preferences-page">
      <header className="profile-page-heading">
        <div>
          <h1>Preferences</h1>
          <p>Choose the starting values used when you open a new lesson. URL selections and verified curriculum records still take priority.</p>
        </div>
        <span>Applied intentionally</span>
      </header>

      <div className="preferences-layout">
        <form action={action} className="profile-form panel">
          <div className="profile-section-heading">
            <h2>New lesson defaults</h2>
            <p>These settings reduce repetitive setup without changing existing lessons.</p>
          </div>
          <div className="profile-field-grid preferences-grid">
            <label>
              <span>Curriculum</span>
              <select defaultValue={preferences.defaultCurriculum} name="defaultCurriculum">
                {curriculumOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Lesson format</span>
              <select defaultValue={preferences.defaultLessonType} name="defaultLessonType">
                {lessonTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Duration</span>
              <select defaultValue={preferences.defaultDuration} name="defaultDuration">
                {durationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Teaching language</span>
              <select defaultValue={preferences.defaultLanguage} name="defaultLanguage">
                {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {state.message ? <div className={`profile-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</div> : null}
          <button className="profile-save" disabled={pending} type="submit">
            {pending ? <Loader2 aria-hidden="true" className="profile-spinner" /> : <Save aria-hidden="true" />}
            {pending ? "Saving preferences…" : "Save preferences"}
          </button>
        </form>

        <aside className="preferences-note panel">
          <BookOpenCheck aria-hidden="true" />
          <div>
            <h2>What these defaults affect</h2>
            <p>They prefill the new-lesson form only. Templates, curriculum-browser selections, and classroom context remain separate teacher choices.</p>
          </div>
          <ul>
            <li>Existing lesson plans are never rewritten.</li>
            <li>Verified curriculum selections override matching fields.</li>
            <li>Classroom context is still applied only when you choose it.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

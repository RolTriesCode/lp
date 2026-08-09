"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  Check,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { checkCurriculumAlignment, observableBloomVerbs, validateObjectives } from "@/lib/pedagogy/analysis";
import { useLessonStore } from "@/stores/lesson-store";
import {
  BloomTaxonomyLevelSchema,
  DifferentiationRecordSchema,
  DifferentiationSuggestionBatchSchema,
  type BloomTaxonomyLevel,
  type CurriculumAlignmentReport,
  type DifferentiationCategory,
  type DifferentiationRecord,
  type DifferentiationSuggestionDraft,
  type ObjectiveValidationReport,
} from "@/schemas/pedagogy";

type ToolTab = "alignment" | "objectives" | "differentiation" | "bloom";

const bloomLabels: Record<BloomTaxonomyLevel, string> = {
  remember: "Remember",
  understand: "Understand",
  apply: "Apply",
  analyze: "Analyze",
  evaluate: "Evaluate",
  create: "Create",
};

const categoryOptions: Array<{ value: DifferentiationCategory; label: string }> = [
  { value: "learner_readiness", label: "Readiness pathways" },
  { value: "language_support", label: "Language support" },
  { value: "enrichment", label: "Enrichment" },
  { value: "accessibility", label: "Accessible participation" },
  { value: "resource_constraints", label: "Limited-resource options" },
];

function StatusIcon({ status }: { status: "pass" | "warning" | "fail" | "not_checked" }) {
  if (status === "pass") return <CheckCircle2 aria-hidden="true" />;
  if (status === "fail") return <CircleAlert aria-hidden="true" />;
  return <AlertTriangle aria-hidden="true" />;
}

export function PedagogyTools() {
  const { activeLesson, updateActiveLesson } = useLessonStore();
  const [tab, setTab] = useState<ToolTab>("alignment");
  const [alignment, setAlignment] = useState<CurriculumAlignmentReport | null>(null);
  const [objectives, setObjectives] = useState<ObjectiveValidationReport | null>(null);
  const [categories, setCategories] = useState<DifferentiationCategory[]>(categoryOptions.map((item) => item.value));
  const [suggestions, setSuggestions] = useState<DifferentiationSuggestionDraft[]>([]);
  const [suggestionState, setSuggestionState] = useState<"idle" | "loading" | "error">("idle");
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
  const [previousDifferentiation, setPreviousDifferentiation] = useState<DifferentiationRecord[] | null>(null);

  const bloomTargets = useMemo(
    () => activeLesson?.pedagogy?.bloomTargets ?? (["understand", "apply"] as BloomTaxonomyLevel[]),
    [activeLesson?.pedagogy?.bloomTargets]
  );

  if (!activeLesson) return null;

  const accepted = activeLesson.pedagogy?.differentiation ?? [];

  function updateBloom(level: BloomTaxonomyLevel, checked: boolean) {
    const next = checked
      ? [...new Set([...bloomTargets, level])]
      : bloomTargets.filter((item) => item !== level);
    if (next.length < 1 || next.length > 3) return;
    const parsed = BloomTaxonomyLevelSchema.array().min(1).max(3).parse(next);
    updateActiveLesson((lesson) => ({
      ...lesson,
      pedagogy: {
        bloomTargets: parsed,
        differentiation: lesson.pedagogy?.differentiation ?? [],
      },
    }));
  }

  function toggleCategory(category: DifferentiationCategory, checked: boolean) {
    setCategories((current) => checked ? [...new Set([...current, category])] : current.filter((item) => item !== category));
  }

  async function requestSuggestions() {
    if (categories.length === 0) {
      setSuggestionState("error");
      setSuggestionMessage("Select at least one differentiation focus.");
      return;
    }
    setSuggestionState("loading");
    setSuggestionMessage(null);
    try {
      const response = await fetch("/api/ai/pedagogy", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: { ...activeLesson, privateTeacherNotes: [] },
          categories,
          maximumSuggestions: Math.min(categories.length + 1, 6),
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "Suggestions could not be generated.");
      const parsed = DifferentiationSuggestionBatchSchema.parse({ suggestions: body.suggestions });
      setSuggestions(parsed.suggestions);
      setSuggestionState("idle");
      setSuggestionMessage("AI suggestions are ready for review. Nothing has been added to the lesson.");
    } catch (error) {
      setSuggestionState("error");
      setSuggestionMessage(error instanceof Error ? error.message : "Suggestions could not be generated.");
    }
  }

  function acceptSuggestion(suggestion: DifferentiationSuggestionDraft) {
    const current = accepted;
    const record = DifferentiationRecordSchema.parse({
      ...suggestion,
      id: crypto.randomUUID(),
      source: "ai",
      acceptedAt: new Date().toISOString(),
    });
    setPreviousDifferentiation(current);
    updateActiveLesson((lesson) => ({
      ...lesson,
      pedagogy: {
        bloomTargets: lesson.pedagogy?.bloomTargets ?? ["understand", "apply"],
        differentiation: [...(lesson.pedagogy?.differentiation ?? []), record],
      },
    }));
    setSuggestions((items) => items.filter((item) => item !== suggestion));
  }

  function removeAccepted(id: string) {
    const current = accepted;
    setPreviousDifferentiation(current);
    updateActiveLesson((lesson) => ({
      ...lesson,
      pedagogy: {
        bloomTargets: lesson.pedagogy?.bloomTargets ?? ["understand", "apply"],
        differentiation: (lesson.pedagogy?.differentiation ?? []).filter((item) => item.id !== id),
      },
    }));
  }

  function undoDifferentiation() {
    if (!previousDifferentiation) return;
    updateActiveLesson((lesson) => ({
      ...lesson,
      pedagogy: {
        bloomTargets: lesson.pedagogy?.bloomTargets ?? ["understand", "apply"],
        differentiation: previousDifferentiation,
      },
    }));
    setPreviousDifferentiation(null);
  }

  return (
    <section aria-labelledby="pedagogy-heading" className="lesson-form-card pedagogy-tools" id="section-pedagogy">
      <div className="card-header pedagogy-header"><div className="card-icon violet"><Brain aria-hidden="true" /></div><div><h2 id="pedagogy-heading">Pedagogy tools</h2><p>Review alignment, objective quality, cognitive demand, and optional classroom pathways without automatic rewrites.</p></div></div>
      <div className="pedagogy-tabs" role="tablist" aria-label="Pedagogy tools">
        {([['alignment', 'Alignment'], ['objectives', 'Objectives'], ['differentiation', 'Differentiation'], ['bloom', 'Bloom controls']] as const).map(([value, label]) => <button aria-controls={`pedagogy-panel-${value}`} aria-selected={tab === value} id={`pedagogy-tab-${value}`} key={value} onClick={() => setTab(value)} role="tab" type="button">{label}</button>)}
      </div>

      <div aria-labelledby={`pedagogy-tab-${tab}`} className="pedagogy-panel" id={`pedagogy-panel-${tab}`} role="tabpanel">
        {tab === "alignment" ? <><div className="pedagogy-tool-intro"><div><h3>Curriculum alignment check</h3><p>Compares lesson metadata and section vocabulary with verified local records. It does not certify the lesson.</p></div><button onClick={() => setAlignment(checkCurriculumAlignment(activeLesson))} type="button">Run deterministic check</button></div>{alignment ? <div className="analysis-results"><div className={`verification-summary ${alignment.verificationState}`}><BadgeCheck aria-hidden="true" /><div><strong>{alignment.verificationState === "verified" ? "Verified local context matched" : alignment.verificationState === "unsupported_claim" ? "Unsupported competency claim" : "Teacher-authored context"}</strong><span>{alignment.record?.sourceReference ?? "No exact local curriculum record matches every metadata field."}</span></div><em>Verified fact</em></div>{alignment.checks.map((check) => <div className={`analysis-row ${check.status}`} key={check.id}><StatusIcon status={check.status} /><div><strong>{check.message}</strong><span>{check.evidence.join(" · ")}</span></div><em>Deterministic</em></div>)}<p className="analysis-disclaimer">{alignment.disclaimer}</p></div> : <div className="pedagogy-empty">Run the checker when you want a snapshot. It never changes lesson content.</div>}</> : null}

        {tab === "objectives" ? <><div className="pedagogy-tool-intro"><div><h3>Objective validator</h3><p>Checks measurability, clarity, grade-language demand, and observable assessment evidence.</p></div><button onClick={() => setObjectives(validateObjectives(activeLesson))} type="button">Validate objectives</button></div>{objectives ? <div className="objective-results">{objectives.items.map((item) => <section key={item.index}><header><strong>{item.index + 1}. {item.objective}</strong><span>{item.detectedBloomLevel ? bloomLabels[item.detectedBloomLevel] : "No measurable verb detected"}</span></header><div>{item.findings.map((finding) => <div className={finding.status} key={finding.criterion}><StatusIcon status={finding.status} /><span><strong>{finding.criterion.replaceAll("_", " ")}</strong>{finding.message}</span></div>)}</div></section>)}<p className="analysis-disclaimer">{objectives.disclaimer}</p></div> : <div className="pedagogy-empty">Validation is advisory and leaves every objective unchanged.</div>}</> : null}

        {tab === "differentiation" ? <><div className="pedagogy-tool-intro"><div><h3>Differentiated instruction</h3><p>Request optional task pathways without assigning labels or inferred traits to learners.</p></div><button disabled={suggestionState === "loading"} onClick={() => void requestSuggestions()} type="button">{suggestionState === "loading" ? <Loader2 aria-hidden="true" className="spinner" /> : <Sparkles aria-hidden="true" />}{suggestionState === "loading" ? "Generating…" : "Suggest supports"}</button></div><fieldset className="differentiation-focus"><legend>Suggestion focus</legend>{categoryOptions.map((item) => <label key={item.value}><input checked={categories.includes(item.value)} onChange={(event) => toggleCategory(item.value, event.target.checked)} type="checkbox" /><span><Check aria-hidden="true" />{item.label}</span></label>)}</fieldset>{suggestionMessage ? <p className={`pedagogy-message ${suggestionState}`} role={suggestionState === "error" ? "alert" : "status"}>{suggestionMessage}</p> : null}{suggestions.length ? <div className="ai-suggestion-list" aria-label="AI suggestions awaiting review">{suggestions.map((suggestion, index) => <article key={`${suggestion.category}-${index}`}><header><span>{suggestion.category.replaceAll("_", " ")}</span><em>AI suggestion</em></header><h4>{suggestion.title}</h4><p>{suggestion.strategy}</p><small>{suggestion.rationale}</small><footer><button onClick={() => setSuggestions((items) => items.filter((item) => item !== suggestion))} type="button"><X aria-hidden="true" /> Reject</button><button className="accept" onClick={() => acceptSuggestion(suggestion)} type="button"><Check aria-hidden="true" /> Accept strategy</button></footer></article>)}</div> : null}<div className="accepted-strategies"><header><div><h4>Accepted strategies</h4><p>These are stored with the lesson but do not rewrite its sections.</p></div>{previousDifferentiation ? <button onClick={undoDifferentiation} type="button"><RotateCcw aria-hidden="true" /> Undo</button> : null}</header>{accepted.length ? accepted.map((item) => <div key={item.id}><span><strong>{item.title}</strong>{item.strategy}</span><em>{item.source === "ai" ? "Accepted AI suggestion" : "Teacher strategy"}</em><button aria-label={`Remove ${item.title}`} onClick={() => removeAccepted(item.id)} type="button"><X aria-hidden="true" /></button></div>) : <p className="pedagogy-empty">No strategies have been accepted.</p>}</div></> : null}

        {tab === "bloom" ? <><div className="pedagogy-tool-intro"><div><h3>Bloom’s taxonomy guidance</h3><p>Select one to three cognitive levels. The choice guides future AI actions; it never rewrites teacher edits.</p></div></div><fieldset className="bloom-controls"><legend>Target cognitive demand</legend>{BloomTaxonomyLevelSchema.options.map((level) => <label key={level}><input checked={bloomTargets.includes(level)} disabled={bloomTargets.includes(level) ? bloomTargets.length === 1 : bloomTargets.length === 3} onChange={(event) => updateBloom(level, event.target.checked)} type="checkbox" /><span><strong>{bloomLabels[level]}</strong><small>{observableBloomVerbs[level].slice(0, 4).join(", ")}</small></span></label>)}</fieldset><div className="bloom-guidance"><Brain aria-hidden="true" /><span><strong>Teacher-controlled metadata</strong>Current objectives remain exactly as written. The selected levels are included only when generating a lesson or requesting a section rewrite.</span></div></> : null}
      </div>
    </section>
  );
}

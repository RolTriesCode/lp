import { ArrowRight, BadgeCheck, SearchX } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VERIFIED_CURRICULUM_RECORDS } from "@/data/curriculum/records";
import { findVerifiedCurriculumRecords, type CurriculumFilter } from "@/lib/curriculum/lookup";
import type { CurriculumType } from "@/schemas/lesson";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export default async function CurriculumPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const curriculumValue = first(params.curriculum);
  const filter: CurriculumFilter = {
    curriculum: curriculumValue === "MATATAG" || curriculumValue === "ILAW"
      ? curriculumValue as CurriculumType
      : undefined,
    gradeLevel: first(params.gradeLevel) || undefined,
    subject: first(params.subject) || undefined,
    quarter: first(params.quarter) || undefined,
    topicSearch: first(params.query) || undefined,
  };
  const records = findVerifiedCurriculumRecords(filter);
  const gradeOptions = unique(VERIFIED_CURRICULUM_RECORDS.map((record) => record.gradeLevel));
  const subjectOptions = unique(VERIFIED_CURRICULUM_RECORDS.map((record) => record.subject));
  const quarterOptions = unique(VERIFIED_CURRICULUM_RECORDS.map((record) => record.quarter));

  return (
    <DashboardShell currentPath="/curriculum">
      <div className="library-page curriculum-page">
        <header className="library-page-header">
          <div>
            <h1>Verified Curriculum Browser</h1>
            <p>Choose only from the local records whose source and verification state are available for review.</p>
          </div>
          <Link className="library-secondary-action" href="/lesson/create">Create custom lesson</Link>
        </header>

        <form action="/curriculum" className="curriculum-filter-bar" method="get">
          <label>
            <span>Search topic or competency</span>
            <input defaultValue={filter.topicSearch} name="query" placeholder="e.g. photosynthesis" type="search" />
          </label>
          <label>
            <span>Curriculum</span>
            <select defaultValue={filter.curriculum ?? ""} name="curriculum">
              <option value="">All verified curricula</option>
              <option value="MATATAG">MATATAG</option>
              <option value="ILAW">ILAW</option>
            </select>
          </label>
          <label>
            <span>Grade</span>
            <select defaultValue={filter.gradeLevel ?? ""} name="gradeLevel">
              <option value="">All grades</option>
              {gradeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Subject</span>
            <select defaultValue={filter.subject ?? ""} name="subject">
              <option value="">All subjects</option>
              {subjectOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Quarter</span>
            <select defaultValue={filter.quarter ?? ""} name="quarter">
              <option value="">All quarters</option>
              {quarterOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <div className="curriculum-filter-actions">
            <button type="submit">Apply filters</button>
            <Link href="/curriculum">Clear</Link>
          </div>
        </form>

        <section className="curriculum-results" aria-labelledby="curriculum-results-heading">
          <div className="resource-list-heading">
            <h2 id="curriculum-results-heading">Verified records</h2>
            <span>{records.length} result{records.length === 1 ? "" : "s"}</span>
          </div>
          {records.length === 0 ? (
            <div className="library-empty-state compact">
              <SearchX aria-hidden="true" size={26} />
              <h3>No verified records match these filters</h3>
              <p>Clear one or more filters. The browser will not invent missing curriculum content.</p>
              <Link href="/curriculum">Clear all filters</Link>
            </div>
          ) : (
            <div className="curriculum-table-wrap">
              <table className="curriculum-table">
                <thead>
                  <tr>
                    <th scope="col">Curriculum context</th>
                    <th scope="col">Verified competency</th>
                    <th scope="col">Provenance</th>
                    <th scope="col"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td data-label="Curriculum context">
                        <strong>{record.topic}</strong>
                        <span>{record.curriculum} · {record.gradeLevel} · {record.subject} · {record.quarter}</span>
                      </td>
                      <td data-label="Verified competency">
                        <p>{record.competencyText}</p>
                        <code>{record.competencyCode || "No official code in this record"}</code>
                      </td>
                      <td data-label="Provenance">
                        <span className="library-status verified"><BadgeCheck aria-hidden="true" size={12} /> Verified</span>
                        <small>{record.sourceReference}</small>
                        <small>{record.verificationStatus === "VERIFIED_DEPED_OFFICIAL" ? "DepEd official" : "Regional official"}</small>
                      </td>
                      <td data-label="Action">
                        <Link href={`/lesson/create?curriculumRecordId=${encodeURIComponent(record.id)}`}>
                          Use competency <ArrowRight aria-hidden="true" size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

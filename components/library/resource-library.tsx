"use client";

import { BookOpen, FileText, SearchX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ReferenceUpload } from "@/components/lesson/reference-upload";
import { defaultResourceRepository } from "@/lib/resources/repository";
import type { TeachingResource } from "@/schemas/resource";

type OperationMessage = { tone: "success" | "error"; text: string };

function formatByteSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceLibrary({ initialQuery, initialSelectedId, initialStatus, initialType }: { initialQuery: string; initialSelectedId: string; initialStatus: string; initialType: string }) {
  const [resources, setResources] = useState<TeachingResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<OperationMessage | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function refresh() {
    setResources(await defaultResourceRepository.list());
    setIsLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadResources() {
      try {
        if (active) await refresh();
      } catch (error) {
        if (!active) return;
        setMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "Saved resources could not be loaded.",
        });
        setIsLoading(false);
      }
    }
    void loadResources();
    return () => {
      active = false;
    };
  }, []);

  async function saveReference(reference: Parameters<typeof defaultResourceRepository.saveReference>[0]) {
    try {
      await refresh();
      setMessage({ tone: "success", text: `“${reference.name}” is privately stored and ready to reuse.` });
    } catch {
      setMessage({
        tone: "error",
        text: `“${reference.name}” was stored, but the library could not refresh. Reload this page to see it.`,
      });
    }
  }

  async function removeResource(id: string) {
    try {
      await defaultResourceRepository.delete(id);
      setPendingDeleteId(null);
      setMessage({
        tone: "success",
        text: "Resource removed from the library. Existing lesson drafts were not changed.",
      });
      await refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The resource could not be removed. Try again without leaving this page.",
      });
    }
  }

  const filteredResources = resources.filter((resource) => {
    const matchesQuery = `${resource.name} ${resource.extractedText.slice(0, 1_000)}`.toLowerCase().includes(initialQuery.toLowerCase());
    const matchesType = initialType === "all" || (initialType === "pdf" ? resource.mimeType === "application/pdf" : resource.mimeType.includes("wordprocessingml"));
    const matchesStatus = initialStatus === "all" || resource.extractionStatus === initialStatus;
    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="library-page">
      <header className="library-page-header">
        <div>
          <h1>Teaching Resources</h1>
          <p>Keep private reference documents and bounded context in one reusable library.</p>
        </div>
        <Link className="library-secondary-action" href="/curriculum">Browse curriculum</Link>
      </header>

      <section className="resource-upload-section" aria-labelledby="resource-upload-heading">
        <div>
          <h2 id="resource-upload-heading">Add reference documents</h2>
          <p>Only safe, bounded DOCX and text-based PDF extraction records are stored.</p>
        </div>
        <ReferenceUpload
          onChange={() => undefined}
          onReferenceUploaded={saveReference}
          references={[]}
        />
      </section>

      <form action="/resources" className="artifact-filter-bar resource-filter-bar" method="get">
        <label><span>Search</span><input defaultValue={initialQuery} name="q" placeholder="Search filename or extracted context" type="search" /></label>
        <label><span>File type</span><select defaultValue={initialType} name="type"><option value="all">DOCX and PDF</option><option value="docx">DOCX</option><option value="pdf">PDF</option></select></label>
        <label><span>Extraction</span><select defaultValue={initialStatus} name="status"><option value="all">All states</option><option value="complete">Ready</option><option value="truncated">Bounded</option></select></label>
        <button type="submit">Apply filters</button><Link href="/resources">Clear</Link>
      </form>

      {message ? (
        <p className={`library-message ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      ) : null}

      <section className="resource-list-section" aria-labelledby="resource-list-heading">
        <div className="resource-list-heading">
          <h2 id="resource-list-heading">Reusable references</h2>
          <span>{filteredResources.length} shown · {resources.length} stored</span>
        </div>
        {isLoading ? (
          <div className="library-loading" role="status">Loading saved resources…</div>
        ) : resources.length === 0 ? (
          <div className="library-empty-state compact">
            <BookOpen aria-hidden="true" size={26} />
            <h3>No reusable resources yet</h3>
            <p>Upload a DOCX or text-based PDF above, or attach one while creating a lesson.</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="library-empty-state compact"><SearchX aria-hidden="true" size={26} /><h3>No resources match these filters</h3><p>Try a broader filename search or include both file types.</p><Link href="/resources">Clear filters</Link></div>
        ) : (
          <ul className="resource-list">
            {filteredResources.map((resource) => (
              <li key={resource.id}>
                <div className="resource-main-row">
                  <span className="resource-file-icon"><FileText aria-hidden="true" size={17} /></span>
                  <div className="resource-copy">
                    <strong>{resource.name}</strong>
                    <span>
                      {formatByteSize(resource.byteSize)} · {resource.segments.length} {resource.segments[0]?.kind === "page" ? "pages" : "sections"} · {resource.extractedText.length.toLocaleString()} context characters
                    </span>
                  </div>
                  <span className={`library-status ${resource.extractionStatus === "truncated" ? "bounded" : "verified"}`}>
                    {resource.extractionStatus === "truncated" ? "Bounded" : "Ready"}
                  </span>
                  <Link className="resource-use-link" href={`/lesson/create?resourceId=${encodeURIComponent(resource.id)}`}>
                    Use in lesson
                  </Link>
                  {pendingDeleteId === resource.id ? (
                    <div className="resource-delete-confirm" role="alert">
                      <span>Remove?</span>
                      <button onClick={() => removeResource(resource.id)} type="button">Remove</button>
                      <button onClick={() => setPendingDeleteId(null)} type="button">Keep</button>
                    </div>
                  ) : (
                    <button
                      aria-label={`Remove ${resource.name}`}
                      className="library-icon-button danger"
                      onClick={() => setPendingDeleteId(resource.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                    </button>
                  )}
                </div>
                <details className="resource-preview" open={initialSelectedId === resource.id || undefined}>
                  <summary>Inspect bounded text</summary>
                  {resource.warnings.length > 0 ? (
                    <ul>{resource.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                  ) : null}
                  <pre>{resource.extractedText}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

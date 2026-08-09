"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import {
  DOCX_MIME_TYPE,
  MAX_REFERENCE_DOCUMENTS,
  MAX_REFERENCE_FILE_BYTES,
  PDF_MIME_TYPE,
  UploadedReferenceSchema,
  type UploadedReference,
} from "@/schemas/reference";

type ReferenceUploadProps = {
  references: UploadedReference[];
  onChange: (references: UploadedReference[]) => void;
  onReferenceUploaded?: (reference: UploadedReference) => void | Promise<void>;
  disabled?: boolean;
};

type UploadAttempt = {
  id: string;
  name: string;
  status: "parsing" | "error";
  message?: string;
};

type UploadResponse =
  | { success: true; data: unknown }
  | { success: false; error?: { message?: string } };

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateCandidate(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "docx" && extension !== "pdf") {
    return "Unsupported file type. Choose a .docx or text-based .pdf file.";
  }
  if (file.size === 0) return "This file is empty. Choose a document that contains text.";
  if (file.size > MAX_REFERENCE_FILE_BYTES) {
    return "This file is larger than 10 MB. Choose a smaller document.";
  }

  const expectedMime = extension === "docx" ? DOCX_MIME_TYPE : PDF_MIME_TYPE;
  if (
    file.type &&
    file.type !== "application/octet-stream" &&
    file.type.toLowerCase() !== expectedMime
  ) {
    return `The file name and reported ${extension.toUpperCase()} type do not match.`;
  }
  return null;
}

export function ReferenceUpload({
  references,
  onChange,
  onReferenceUploaded,
  disabled = false,
}: ReferenceUploadProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const controllersRef = useRef(new Set<AbortController>());
  const [attempts, setAttempts] = useState<UploadAttempt[]>([]);

  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, []);

  const isParsing = attempts.some((attempt) => attempt.status === "parsing");
  const remainingSlots = Math.max(0, MAX_REFERENCE_DOCUMENTS - references.length);
  const uploadDisabled = disabled || isParsing || remainingSlots === 0;

  function dismissAttempt(id: string) {
    setAttempts((current) => current.filter((attempt) => attempt.id !== id));
  }

  async function uploadFile(file: File, attemptId: string): Promise<UploadedReference | null> {
    const validationMessage = validateCandidate(file);
    if (validationMessage) {
      setAttempts((current) =>
        current.map((attempt) =>
          attempt.id === attemptId
            ? { ...attempt, status: "error", message: validationMessage }
            : attempt
        )
      );
      return null;
    }

    const controller = new AbortController();
    controllersRef.current.add(controller);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads/reference", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const body = (await response.json().catch(() => null)) as UploadResponse | null;

      if (!response.ok || !body?.success) {
        const message =
          body && !body.success
            ? body.error?.message
            : undefined;
        throw new Error(message || "This document could not be parsed. Choose another file or try again.");
      }

      const parsed = UploadedReferenceSchema.safeParse(body.data);
      if (!parsed.success) {
        throw new Error("The server returned an invalid reference record. Please try the upload again.");
      }

      await onReferenceUploaded?.(parsed.data);
      dismissAttempt(attemptId);
      return parsed.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return null;
      const message =
        error instanceof Error
          ? error.message
          : "This document could not be parsed. Choose another file or try again.";
      setAttempts((current) =>
        current.map((attempt) =>
          attempt.id === attemptId ? { ...attempt, status: "error", message } : attempt
        )
      );
      return null;
    } finally {
      controllersRef.current.delete(controller);
    }
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const acceptedFiles = selectedFiles.slice(0, remainingSlots);
    const overflowFiles = selectedFiles.slice(remainingSlots);
    const queued = acceptedFiles.map((file) => ({
      id: `upload-${crypto.randomUUID()}`,
      name: file.name,
      status: "parsing" as const,
    }));
    const rejected = overflowFiles.map((file) => ({
      id: `upload-${crypto.randomUUID()}`,
      name: file.name,
      status: "error" as const,
      message: `You can attach up to ${MAX_REFERENCE_DOCUMENTS} references. Remove one before adding another.`,
    }));

    setAttempts((current) => [...current, ...queued, ...rejected]);
    const nextReferences = [...references];

    for (let index = 0; index < acceptedFiles.length; index += 1) {
      const uploaded = await uploadFile(acceptedFiles[index], queued[index].id);
      if (uploaded) {
        nextReferences.push(uploaded);
        onChange([...nextReferences]);
      }
    }
  }

  function removeReference(id: string) {
    onChange(references.filter((reference) => reference.id !== id));
  }

  return (
    <div className="reference-upload-control">
      <div className="reference-upload-toolbar">
        <div>
          <p className="reference-upload-title">Attach source material</p>
          <p className="reference-upload-hint" id={hintId}>
            DOCX or text-based PDF, up to 10 MB each. {remainingSlots} of {MAX_REFERENCE_DOCUMENTS} slots available.
          </p>
        </div>
        <label
          aria-disabled={uploadDisabled}
          className={`reference-upload-button ${uploadDisabled ? "disabled" : ""}`}
          htmlFor={inputId}
        >
          {isParsing ? <Loader2 aria-hidden="true" className="spinner" size={15} /> : <FileUp aria-hidden="true" size={15} />}
          {isParsing ? "Extracting text" : "Choose files"}
        </label>
        <input
          accept={`${DOCX_MIME_TYPE},${PDF_MIME_TYPE},.docx,.pdf`}
          aria-describedby={hintId}
          className="reference-file-input"
          disabled={uploadDisabled}
          id={inputId}
          multiple
          onChange={handleFilesSelected}
          ref={inputRef}
          type="file"
        />
      </div>

      <div aria-atomic="false" aria-live="polite" className="reference-status-region">
        {references.length === 0 && attempts.length === 0 ? (
          <div className="reference-empty-state">
            <ShieldCheck aria-hidden="true" size={18} />
            <p>
              Source files are kept in private account storage. Only bounded extracted text is shared with lesson generation; links, macros, and active content are never run.
            </p>
          </div>
        ) : null}

        {attempts.map((attempt) => (
          <div className={`reference-row ${attempt.status}`} key={attempt.id}>
            <div className="reference-row-icon">
              {attempt.status === "parsing" ? (
                <Loader2 aria-hidden="true" className="spinner" size={16} />
              ) : (
                <AlertCircle aria-hidden="true" size={16} />
              )}
            </div>
            <div className="reference-row-main">
              <strong>{attempt.name}</strong>
              <span>
                {attempt.status === "parsing"
                  ? "Checking file safety and extracting bounded text…"
                  : attempt.message}
              </span>
            </div>
            {attempt.status === "error" ? (
              <button
                aria-label={`Dismiss error for ${attempt.name}`}
                className="reference-icon-button"
                onClick={() => dismissAttempt(attempt.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            ) : null}
          </div>
        ))}

        {references.map((reference) => (
          <div className="reference-record" key={reference.id}>
            <div className="reference-row">
              <div className="reference-row-icon ready">
                <FileText aria-hidden="true" size={16} />
              </div>
              <div className="reference-row-main">
                <strong>{reference.name}</strong>
                <span>
                  {formatByteSize(reference.byteSize)} · {reference.segments.length} {reference.segments[0]?.kind === "page" ? "pages" : "sections"} · {reference.extractedText.length.toLocaleString()} context characters
                </span>
              </div>
              <span className={`reference-status-badge ${reference.extractionStatus}`}>
                <CheckCircle2 aria-hidden="true" size={12} />
                {reference.extractionStatus === "truncated" ? "Bounded" : "Ready"}
              </span>
              <button
                aria-label={`Remove ${reference.name}`}
                className="reference-icon-button"
                disabled={disabled}
                onClick={() => removeReference(reference.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
            <details className="reference-inspection">
              <summary>Inspect extracted context</summary>
              {reference.warnings.length > 0 ? (
                <ul className="reference-warning-list">
                  {reference.warnings.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
              <pre>{reference.extractedText}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { ArchiveRestore, CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  importLocalPrototypeLessons,
  scanLocalPrototypeLessons,
  type LocalLessonImportScan,
} from "@/lib/persistence/local-import";

type LocalLessonImportProps = {
  onImported: () => void | Promise<void>;
};

export function LocalLessonImport({ onImported }: LocalLessonImportProps) {
  const [scan, setScan] = useState<LocalLessonImportScan>({ lessons: [], invalidCount: 0 });
  const [isConfirming, setIsConfirming] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setScan(scanLocalPrototypeLessons()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (scan.lessons.length === 0 && !message) return null;

  async function handleImport() {
    setIsImporting(true);
    setMessage(null);
    try {
      const result = await importLocalPrototypeLessons(scan.lessons);
      const untouched = scan.invalidCount + result.rejected;
      setMessage({
        tone: "success",
        text: `${result.imported.length} local lesson${result.imported.length === 1 ? "" : "s"} imported; ${result.skipped.length} already imported${untouched ? `; ${untouched} invalid record${untouched === 1 ? " was" : "s were"} left untouched` : ""}. Local copies were not deleted.`,
      });
      setIsConfirming(false);
      await onImported();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Local lessons could not be imported. Nothing was deleted.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="local-import-panel" aria-labelledby="local-import-heading">
      <ArchiveRestore aria-hidden="true" size={20} />
      <div className="local-import-copy">
        <h2 id="local-import-heading">Local prototype lessons found</h2>
        <p>
          {scan.lessons.length} valid draft{scan.lessons.length === 1 ? "" : "s"} can be copied to your current signed-in account. Importing never edits or removes the browser copies.
        </p>
        {message ? (
          <p className={`local-import-message ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>
            {message.tone === "success" ? <CheckCircle2 aria-hidden="true" size={14} /> : null}
            {message.text}
          </p>
        ) : null}
      </div>
      {isConfirming ? (
        <div className="local-import-actions" role="group" aria-label="Confirm local lesson import">
          <button disabled={isImporting} onClick={() => void handleImport()} type="button">
            {isImporting ? <Loader2 aria-hidden="true" className="spinner" size={14} /> : null}
            {isImporting ? "Importing…" : "Import valid drafts"}
          </button>
          <button aria-label="Cancel import" disabled={isImporting} onClick={() => setIsConfirming(false)} type="button">
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      ) : (
        <button className="local-import-start" onClick={() => setIsConfirming(true)} type="button">
          Review import
        </button>
      )}
    </section>
  );
}

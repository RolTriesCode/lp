import { describe, it } from "node:test";
import assert from "node:assert";
import { processReferenceUpload } from "../../lib/documents/import/ingest";

describe("Reference Document Ingestion Engine (`lib/documents/import/ingest.ts`)", () => {
  it("should process a valid text buffer as a mock reference document", async () => {
    // Create a mock docx text buffer representation
    const textBuffer = Buffer.from("Sample Photosynthesis Reference text for DepEd Science Grade 7.");
    const result = await processReferenceUpload(textBuffer, "photosynthesis_ref.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    assert.strictEqual(result.filename, "photosynthesis_ref.docx");
    assert.strictEqual(result.fileType, "docx");
    assert.ok(result.extractedText.includes("Photosynthesis Reference"));
    assert.ok(result.id.startsWith("ref-"));
  });

  it("should reject unsupported file types with clear error messages", async () => {
    const dummyBuffer = Buffer.from("Executable content");
    await assert.rejects(
      async () => {
        await processReferenceUpload(dummyBuffer, "malicious.exe", "application/x-msdownload");
      },
      (err: any) => {
        return err.message.includes("Unsupported file format");
      }
    );
  });

  it("should reject files exceeding the 10MB maximum size limit", async () => {
    // Create oversized dummy buffer (> 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    await assert.rejects(
      async () => {
        await processReferenceUpload(largeBuffer, "oversized_book.pdf", "application/pdf");
      },
      (err: any) => {
        return err.message.includes("exceeds maximum allowed limit of 10MB");
      }
    );
  });

  it("should truncate reference text exceeding 10,000 characters and log warning", async () => {
    const longText = "A".repeat(15000);
    const textBuffer = Buffer.from(longText);
    const result = await processReferenceUpload(textBuffer, "long_reference.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    assert.ok(result.truncatedText.length < 15000);
    assert.ok(result.truncatedText.includes("Reference text truncated"));
    assert.ok(result.warnings && result.warnings.length > 0);
  });
});

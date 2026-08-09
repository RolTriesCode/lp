if (typeof window !== "undefined") {
  throw new Error("Reference document ingestion modules cannot be imported in client components.");
}

import mammoth from "mammoth";
import pdf from "pdf-parse";
import type { ReferenceDocument } from "@/schemas/reference";

const MAX_TEXT_LENGTH = 10000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Clean control characters and normalize whitespace.
 */
function cleanExtractedText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove non-printable control chars
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts raw text from DOCX buffer.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return cleanExtractedText(result.value || "");
}

/**
 * Extracts raw text from PDF buffer.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return cleanExtractedText(data.text || "");
}

/**
 * Main ingestion entry point processing reference files.
 */
export async function processReferenceUpload(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ReferenceDocument> {
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds maximum allowed limit of 10MB.");
  }

  const extension = filename.split(".").pop()?.toLowerCase() || "";
  let fileType: "docx" | "pdf";
  let extractedRaw = "";
  const warnings: string[] = [];

  if (extension === "docx" || mimeType.includes("wordprocessingml")) {
    fileType = "docx";
    try {
      extractedRaw = await extractTextFromDocx(fileBuffer);
    } catch (err: any) {
      throw new Error(`Failed to parse DOCX file: ${err.message || "Invalid or corrupt format"}`);
    }
  } else if (extension === "pdf" || mimeType.includes("pdf")) {
    fileType = "pdf";
    try {
      extractedRaw = await extractTextFromPdf(fileBuffer);
    } catch (err: any) {
      throw new Error(`Failed to parse PDF file: ${err.message || "Invalid or corrupt format"}`);
    }
  } else {
    throw new Error("Unsupported file format. Please upload a .docx or .pdf reference document.");
  }

  if (!extractedRaw || extractedRaw.length < 5) {
    warnings.push("Extracted text was minimal or empty. The file may be image-only or scanned.");
  }

  let truncatedText = extractedRaw;
  if (extractedRaw.length > MAX_TEXT_LENGTH) {
    truncatedText = extractedRaw.substring(0, MAX_TEXT_LENGTH) + "\n\n[...Reference text truncated to 10,000 character context limit...]";
    warnings.push(`Extracted text exceeded ${MAX_TEXT_LENGTH} characters and was safely bounded for AI context.`);
  }

  const id = `ref-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    filename,
    fileType,
    sizeBytes: fileBuffer.length,
    extractedText: extractedRaw,
    truncatedText,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

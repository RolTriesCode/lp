if (typeof window !== "undefined") {
  throw new Error("Reference document ingestion cannot run in a client component.");
}

import mammoth from "mammoth";
import {
  FormatError,
  InvalidPDFException,
  PasswordException,
  PDFParse,
} from "pdf-parse";
import {
  DOCX_MIME_TYPE,
  MAX_REFERENCE_FILE_BYTES,
  MAX_REFERENCE_SEGMENTS,
  MAX_REFERENCE_TEXT_CHARACTERS,
  PDF_MIME_TYPE,
  UploadedReferenceSchema,
  type ReferenceSegment,
  type UploadedReference,
} from "@/schemas/reference";

const MAX_PDF_PAGES = 50;
const MAX_DOCX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;
const MIN_EXTRACTED_CHARACTERS = 5;
const MAX_WARNING_CHARACTERS = 240;

export type ReferenceUploadErrorCode =
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE"
  | "UNSAFE_FILE"
  | "ENCRYPTED_DOCUMENT"
  | "MALFORMED_DOCUMENT"
  | "NO_EXTRACTABLE_TEXT";

export class ReferenceUploadError extends Error {
  readonly code: ReferenceUploadErrorCode;
  readonly status: number;

  constructor(code: ReferenceUploadErrorCode, message: string, status: number = 400) {
    super(message);
    this.name = "ReferenceUploadError";
    this.code = code;
    this.status = status;
  }
}

type SupportedFile = {
  mimeType: typeof DOCX_MIME_TYPE | typeof PDF_MIME_TYPE;
  type: "docx" | "pdf";
};

type ParsedReference = {
  text: string;
  segments: ReferenceSegment[];
  warnings: string[];
  truncated: boolean;
};

function cleanName(name: string): string {
  return name.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 255);
}

export function normalizeExtractedText(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasZipSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08))
  );
}

function hasOleSignature(buffer: Buffer): boolean {
  const ole = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  return buffer.length >= ole.length && ole.every((byte, index) => buffer[index] === byte);
}

function hasPdfSignature(buffer: Buffer): boolean {
  return buffer.subarray(0, Math.min(buffer.length, 1024)).includes(Buffer.from("%PDF-"));
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minimumOffset = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function inspectDocxArchive(buffer: Buffer): string[] {
  const endOffset = findEndOfCentralDirectory(buffer);
  if (endOffset < 0 || endOffset + 22 > buffer.length) {
    throw new ReferenceUploadError(
      "MALFORMED_DOCUMENT",
      "This DOCX file is malformed or has an invalid archive directory.",
      422
    );
  }

  const diskNumber = buffer.readUInt16LE(endOffset + 4);
  const centralDirectoryDisk = buffer.readUInt16LE(endOffset + 6);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const directorySize = buffer.readUInt32LE(endOffset + 12);
  const directoryOffset = buffer.readUInt32LE(endOffset + 16);
  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    entryCount === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff ||
    directoryOffset + directorySize > buffer.length
  ) {
    throw new ReferenceUploadError(
      "UNSAFE_FILE",
      "This DOCX archive uses an unsupported or unsafe container format.",
      422
    );
  }

  const names: string[] = [];
  let offset = directoryOffset;
  let totalUncompressedBytes = 0;

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new ReferenceUploadError(
        "MALFORMED_DOCUMENT",
        "This DOCX file has a malformed archive directory.",
        422
      );
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const uncompressedBytes = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nextOffset = offset + 46 + fileNameLength + extraLength + commentLength;
    if (nextOffset > buffer.length || uncompressedBytes === 0xffffffff) {
      throw new ReferenceUploadError(
        "UNSAFE_FILE",
        "This DOCX archive uses an unsupported or unsafe container format.",
        422
      );
    }
    if ((flags & 0x0001) !== 0) {
      throw new ReferenceUploadError(
        "ENCRYPTED_DOCUMENT",
        "Encrypted DOCX archives are not supported. Upload an unencrypted copy.",
        422
      );
    }

    totalUncompressedBytes += uncompressedBytes;
    if (totalUncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES) {
      throw new ReferenceUploadError(
        "UNSAFE_FILE",
        "This DOCX expands beyond the safe processing limit. Choose a smaller document.",
        422
      );
    }

    names.push(buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8"));
    offset = nextOffset;
  }

  const normalizedNames = names.map((name) => name.toLowerCase());
  if (!normalizedNames.includes("[content_types].xml") || !normalizedNames.includes("word/document.xml")) {
    throw new ReferenceUploadError(
      "MALFORMED_DOCUMENT",
      "This archive does not contain a valid Word document.",
      422
    );
  }
  return normalizedNames;
}

function containsActiveOfficeContent(entryNames: string[]): boolean {
  return entryNames.some(
    (name) => name.endsWith("vbaproject.bin") || name.startsWith("word/activex/")
  );
}

export function validateReferenceFile(
  buffer: Buffer,
  rawName: string,
  rawMimeType: string
): SupportedFile & { name: string } {
  const name = cleanName(rawName);
  if (!name || buffer.length === 0) {
    throw new ReferenceUploadError("INVALID_FILE", "Choose a non-empty DOCX or PDF file.");
  }
  if (buffer.length > MAX_REFERENCE_FILE_BYTES) {
    throw new ReferenceUploadError(
      "FILE_TOO_LARGE",
      "This file is larger than 10 MB. Choose a smaller DOCX or PDF.",
      413
    );
  }

  const extension = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  const declaredMime = rawMimeType.trim().toLowerCase();
  const isGenericMime = !declaredMime || declaredMime === "application/octet-stream";

  if (extension !== "docx" && extension !== "pdf") {
    throw new ReferenceUploadError(
      "UNSUPPORTED_FILE",
      "Unsupported file type. Upload a .docx or text-based .pdf reference.",
      415
    );
  }

  if (extension === "docx") {
    if (!isGenericMime && declaredMime !== DOCX_MIME_TYPE) {
      throw new ReferenceUploadError(
        "UNSUPPORTED_FILE",
        "The file extension and reported type do not match a DOCX document.",
        415
      );
    }
    if (hasOleSignature(buffer)) {
      throw new ReferenceUploadError(
        "ENCRYPTED_DOCUMENT",
        "Password-protected or legacy Word files are not supported. Save an unencrypted .docx copy and try again.",
        422
      );
    }
    if (!hasZipSignature(buffer)) {
      throw new ReferenceUploadError(
        "MALFORMED_DOCUMENT",
        "This DOCX file is malformed or does not contain a valid Word document.",
        422
      );
    }
    const entryNames = inspectDocxArchive(buffer);
    if (containsActiveOfficeContent(entryNames)) {
      throw new ReferenceUploadError(
        "UNSAFE_FILE",
        "Macro-enabled or active Word content is not accepted. Save a clean .docx copy and try again.",
        422
      );
    }
    return { name, mimeType: DOCX_MIME_TYPE, type: "docx" };
  }

  if (!isGenericMime && declaredMime !== PDF_MIME_TYPE) {
    throw new ReferenceUploadError(
      "UNSUPPORTED_FILE",
      "The file extension and reported type do not match a PDF document.",
      415
    );
  }
  if (!hasPdfSignature(buffer)) {
    throw new ReferenceUploadError(
      "MALFORMED_DOCUMENT",
      "This PDF file is malformed or does not contain a valid PDF header.",
      422
    );
  }
  return { name, mimeType: PDF_MIME_TYPE, type: "pdf" };
}

function warning(message: string): string {
  return normalizeExtractedText(message).slice(0, MAX_WARNING_CHARACTERS);
}

function assembleBoundedText(
  entries: Array<{ kind: "page" | "section"; index: number; text: string }>
): Pick<ParsedReference, "text" | "segments" | "truncated"> {
  const parts: string[] = [];
  const segments: ReferenceSegment[] = [];
  let used = 0;
  let truncated = entries.length > MAX_REFERENCE_SEGMENTS;

  for (const entry of entries.slice(0, MAX_REFERENCE_SEGMENTS)) {
    const normalized = normalizeExtractedText(entry.text);
    if (!normalized) continue;

    const label = `${entry.kind === "page" ? "Page" : "Section"} ${entry.index}`;
    const separator = parts.length === 0 ? `--- ${label} ---\n` : `\n\n--- ${label} ---\n`;
    const remaining = MAX_REFERENCE_TEXT_CHARACTERS - used - separator.length;
    if (remaining <= 0) {
      truncated = true;
      break;
    }

    const included = normalized.slice(0, remaining);
    parts.push(`${separator}${included}`);
    used += separator.length + included.length;
    segments.push({
      kind: entry.kind,
      index: entry.index,
      label,
      characterCount: normalized.length,
      includedCharacterCount: included.length,
    });

    if (included.length < normalized.length) {
      truncated = true;
      break;
    }
  }

  return { text: parts.join("").trim(), segments, truncated };
}

async function parseDocx(buffer: Buffer): Promise<ParsedReference> {
  try {
    // Raw-text extraction never renders links, images, scripts, or embedded objects.
    // Mammoth's external file access is disabled by default for buffer inputs.
    const result = await mammoth.extractRawText({ buffer });
    const sections = normalizeExtractedText(result.value)
      .split(/\n{2,}/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text, index) => ({ kind: "section" as const, index: index + 1, text }));
    const bounded = assembleBoundedText(sections);
    const warnings = result.messages
      .map((message) => warning(message.message))
      .filter(Boolean)
      .slice(0, 8);

    if (sections.length > MAX_REFERENCE_SEGMENTS) {
      warnings.push(`Only the first ${MAX_REFERENCE_SEGMENTS} document sections were considered.`);
    }
    if (bounded.truncated) {
      warnings.push("The extracted text was shortened to the 8,000-character AI context limit.");
    }
    return { ...bounded, warnings: warnings.slice(0, 10) };
  } catch (error) {
    throw mapParserError(error, "docx");
  }
}

async function parsePdf(buffer: Buffer): Promise<ParsedReference> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    disableAutoFetch: true,
    disableStream: true,
    enableXfa: false,
    isEvalSupported: false,
    maxImageSize: 1_000_000,
    stopAtErrors: true,
  });

  try {
    const result = await parser.getText({
      first: MAX_PDF_PAGES,
      lineEnforce: true,
      pageJoiner: "",
      parseHyperlinks: false,
    });
    const pages = result.pages.map((page) => ({
      kind: "page" as const,
      index: page.num,
      text: page.text,
    }));
    const bounded = assembleBoundedText(pages);
    const warnings: string[] = [];

    if (result.total > MAX_PDF_PAGES) {
      warnings.push(`Only the first ${MAX_PDF_PAGES} of ${result.total} PDF pages were considered.`);
    }
    if (bounded.truncated) {
      warnings.push("The extracted text was shortened to the 8,000-character AI context limit.");
    }
    return {
      ...bounded,
      truncated: bounded.truncated || result.total > MAX_PDF_PAGES,
      warnings,
    };
  } catch (error) {
    throw mapParserError(error, "pdf");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export function mapParserError(error: unknown, type: "docx" | "pdf"): ReferenceUploadError {
  if (error instanceof ReferenceUploadError) return error;

  if (error instanceof PasswordException || (error instanceof Error && error.name === "PasswordException")) {
    return new ReferenceUploadError(
      "ENCRYPTED_DOCUMENT",
      "Encrypted or password-protected PDFs are not supported. Upload an unencrypted copy.",
      422
    );
  }

  if (
    error instanceof InvalidPDFException ||
    error instanceof FormatError ||
    (error instanceof Error && ["InvalidPDFException", "FormatError"].includes(error.name))
  ) {
    return new ReferenceUploadError(
      "MALFORMED_DOCUMENT",
      "This PDF is malformed and could not be read. Export a fresh PDF and try again.",
      422
    );
  }

  return new ReferenceUploadError(
    "MALFORMED_DOCUMENT",
    `This ${type.toUpperCase()} document could not be read. It may be damaged or use an unsupported format.`,
    422
  );
}

export async function processReferenceUpload(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadedReference> {
  const file = validateReferenceFile(fileBuffer, filename, mimeType);
  const parsed = file.type === "docx" ? await parseDocx(fileBuffer) : await parsePdf(fileBuffer);

  if (parsed.text.length < MIN_EXTRACTED_CHARACTERS) {
    throw new ReferenceUploadError(
      "NO_EXTRACTABLE_TEXT",
      file.type === "pdf"
        ? "No readable text was found in this PDF. Scanned or image-only PDFs need OCR, which is not supported yet."
        : "No readable text was found in this DOCX file. Add document text and try again.",
      422
    );
  }

  return UploadedReferenceSchema.parse({
    id: `ref-${crypto.randomUUID()}`,
    name: file.name,
    mimeType: file.mimeType,
    byteSize: fileBuffer.length,
    extractionStatus: parsed.truncated ? "truncated" : "complete",
    extractedText: parsed.text,
    segments: parsed.segments,
    warnings: parsed.warnings,
  });
}

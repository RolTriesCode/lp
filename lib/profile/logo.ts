export const MAX_SCHOOL_LOGO_BYTES = 5 * 1024 * 1024;

const MIME_DETAILS = {
  "image/png": { extension: "png" },
  "image/jpeg": { extension: "jpg" },
  "image/webp": { extension: "webp" },
} as const;

export type SchoolLogoMime = keyof typeof MIME_DETAILS;

export function detectSchoolLogoMime(bytes: Uint8Array): SchoolLogoMime | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export function schoolLogoExtension(mime: SchoolLogoMime): string {
  return MIME_DETAILS[mime].extension;
}

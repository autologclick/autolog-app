import fs from 'fs';
import path from 'path';

// =============================================
// Constants
// =============================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'] as const;
const IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/;

// =============================================
// Types
// =============================================

export interface ParsedImage {
  ext: string;
  buffer: Buffer;
}

// =============================================
// Base64 parsing
// =============================================

/**
 * Parse a base64 data URL into extension and buffer.
 * Returns null if the input is not a valid image data URL.
 */
export function parseBase64Image(image: string): ParsedImage | null {
  if (!image || !image.startsWith('data:image/')) return null;
  const matches = image.match(IMAGE_REGEX);
  if (!matches) return null;
  const ext = matches[1] === 'jpg' ? 'jpeg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  return { ext, buffer };
}

/**
 * Validate parsed image size.
 * Returns an error message (Hebrew) if invalid, or null if OK.
 */
export function validateImageSize(parsed: ParsedImage, maxSize: number = MAX_FILE_SIZE): string | null {
  if (parsed.buffer.length > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return `התמונה גדולה מדי (מקסימום ${maxMB}MB)`;
  }
  return null;
}

// =============================================
// Directory helpers
// =============================================

/**
 * Ensure a directory exists (creates recursively if missing).
 * Returns the resolved path.
 */
export function ensureUploadDir(baseDir: string, subDir?: string): string {
  const dir = subDir ? path.join(baseDir, subDir) : baseDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// =============================================
// File operations
// =============================================

/**
 * Save a buffer to a file in the given directory.
 * Returns the public URL path.
 */
export function saveImageFile(
  dir: string,
  filename: string,
  buffer: Buffer,
  publicPrefix: string,
): string {
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `${publicPrefix}/${filename}`;
}

/**
 * Delete files matching a predicate in a directory.
 * Uses basename check for path traversal prevention.
 */
export function deleteMatchingFiles(dir: string, predicate: (filename: string) => boolean): void {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(predicate);
  files.forEach((f) => {
    const sanitized = path.basename(f);
    if (sanitized === f) {
      fs.unlinkSync(path.join(dir, sanitized));
    }
  });
}

/**
 * List image files in a directory (excluding files matching an optional exclude pattern).
 */
export function listImageFiles(
  dir: string,
  excludePrefix?: string,
): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => {
      if (excludePrefix && f.startsWith(excludePrefix)) return false;
      return /\.(jpeg|jpg|png|webp)$/i.test(f);
    })
    .sort();
}

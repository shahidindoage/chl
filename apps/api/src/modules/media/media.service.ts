import { promises as fs } from "node:fs";
import path from "node:path";

import type { MediaFileDto } from "@tournament/shared";

import { env } from "../../core/config/env.js";
import { ApiError } from "../../core/utils/ApiError.js";

/**
 * Media library service.
 *
 * Files are stored on disk in env.UPLOAD_DIR and served by express.static in
 * app.ts. There is deliberately no Prisma model: the directory is the source
 * of truth, so anything uploaded through any route (including the news module)
 * appears in the library without a second write path to keep in sync.
 */

/** Extension to MIME, for the preview and the "open in new tab" hint. */
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
};

function mimeFor(filename: string): string | null {
  return MIME_BY_EXT[path.extname(filename).toLowerCase()] ?? null;
}

export async function listMedia(): Promise<MediaFileDto[]> {
  // Directory may not exist yet on a fresh checkout, which is not an error.
  let names: string[];
  try {
    names = await fs.readdir(env.UPLOAD_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  const files = await Promise.all(
    names.map(async (filename): Promise<MediaFileDto | null> => {
      // Skip dotfiles (.gitkeep, editor swap files, partial downloads). They
      // are not media and must never be offered as a link.
      if (filename.startsWith(".")) return null;

      const full = path.join(env.UPLOAD_DIR, filename);
      try {
        const stat = await fs.stat(full);
        // Skip directories and anything that is not a regular file.
        if (!stat.isFile()) return null;
        return {
          filename,
          // encodeURIComponent so spaces and # in a name cannot break the URL.
          url: `/uploads/${encodeURIComponent(filename)}`,
          mimeType: mimeFor(filename),
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      } catch {
        // Raced with a delete, or a broken symlink. Skip rather than fail the list.
        return null;
      }
    })
  );

  const present = files.filter((f): f is MediaFileDto => f !== null);
  // Newest first: the admin's next action is almost always with a fresh upload.
  return present.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/**
 * Resolve a client-supplied filename to an absolute path inside the upload
 * directory, or reject it.
 *
 * Guards path traversal: "..%2F..%2Fapps" must not escape UPLOAD_DIR. The
 * basename comparison rejects separators, and the resolved prefix check is a
 * second line of defence in case the first is ever weakened.
 */
export function resolveUploadPath(filename: string): string {
  const decoded = decodeURIComponent(filename);
  if (decoded.length === 0 || decoded.length > 255) {
    throw ApiError.badRequest("Invalid filename");
  }
  if (path.basename(decoded) !== decoded) {
    throw ApiError.badRequest("Invalid filename");
  }
  if (decoded.includes("\0")) {
    throw ApiError.badRequest("Invalid filename");
  }

  const uploadsDir = path.resolve(env.UPLOAD_DIR);
  const full = path.resolve(uploadsDir, decoded);
  if (full !== uploadsDir && !full.startsWith(uploadsDir + path.sep)) {
    throw ApiError.badRequest("Invalid filename");
  }
  return full;
}

export async function deleteMedia(filename: string): Promise<void> {
  const full = resolveUploadPath(filename);
  try {
    await fs.unlink(full);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw ApiError.notFound("File not found");
    }
    throw err;
  }
}
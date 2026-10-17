import multer from "multer";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { Router, type NextFunction, type Request, type Response } from "express";

import { env } from "../../core/config/env.js";
import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/requireRole.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as mediaController from "./media.controller.js";

/**
 * Media library routes: list / upload / delete for files in the uploads
 * directory.
 *
 * Gated on "news:write" (Section 7) rather than a new permission, because the
 * central map defines permissions and modules must not invent their own. That
 * grants exactly super_admin and content_manager, which is who owns site
 * imagery.
 */
export const mediaRouter = Router();

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/x-icon",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "text/plain",
  "text/csv",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "image/x-icon": ".ico",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
};

/** Per-request ceiling. Individual files are still capped at MAX_UPLOAD_SIZE_MB. */
const MAX_FILES_PER_REQUEST = 20;

/** Leaves room for the stem, a hyphen and the 16-char unique suffix. */
const MAX_STEM_LENGTH = 80;

/**
 * Reduce a client-supplied filename to a safe, readable stem.
 *
 * Admins need to recognise their own files in the library, so the original
 * name is kept where possible. Everything that could escape the uploads
 * directory or break on a filesystem is removed:
 *
 *  - any directory component ("../../etc/passwd" -> "passwd")
 *  - path separators and control characters
 *  - characters Windows rejects outright (< > : " | ? *)
 *  - leading dots, so the name can never become ".", ".." or a hidden file
 *
 * Unicode letters are kept: team and player names are often non-Latin and a
 * Hindi filename should survive intact.
 */
/**
 * Multer hands us the multipart filename as a latin1 string, but browsers
 * encode that header as UTF-8. A Hindi or Tamil filename therefore arrives as
 * mojibake ("à¤®à¥à¤–à¤¯"), which would then be written to disk verbatim.
 * Re-decoding latin1 -> UTF-8 restores the real name, and is a no-op for a
 * filename that genuinely was ASCII.
 */
function decodeMultipartFilename(name: string): string {
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  // Guard against a name that was never mojibake: if the round trip produced
  // replacement characters it means the input was already UTF-8, so keep it.
  return decoded.includes("\uFFFD") ? name : decoded;
}

function sanitiseStem(original: string): string {
  const base = path.basename(decodeMultipartFilename(original).replace(/\\/g, "/"));

  const cleaned = base
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"|?*]/g, "")
    .replace(/[.\s]+$/g, "") // no trailing dots or spaces (Windows rejects these)
    .trim();

  // Strip the extension; it is re-derived from the MIME type below so the
  // stored name can never claim an extension the content does not have.
  const withoutExt = cleaned.replace(/\.[^.]*$/, "");

  // Collapse any interior run of dots. "trailingdots.." is harmless on its own,
  // but a stem ending in ".." plus the "-<suffix>" we append would read as an
  // odd path segment, and dot-runs invite traversal tricks if this code is ever
  // reused in a context that does not escape them.
  const stem = withoutExt
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim();

  if (stem.length === 0) return "file";
  return stem.length > MAX_STEM_LENGTH ? stem.slice(0, MAX_STEM_LENGTH) : stem;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, env.UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      // The readable original stem is kept so an admin can recognise the file
      // in the list; a random suffix is appended so re-uploading "logo.png"
      // never overwrites the earlier one. The extension always comes from the
      // MIME type, never from the client name, so "photo.png" cannot smuggle a
      // .html or .php suffix.
      const stem = sanitiseStem(file.originalname);
      const ext = EXT_BY_MIME[file.mimetype] ?? ".bin";
      const unique = randomBytes(8).toString("hex");
      cb(null, `${stem}-${unique}${ext}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: MAX_FILES_PER_REQUEST },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

/**
 * Translate multer's own errors into ApiError.
 *
 * Without this a LIMIT_FILE_SIZE overflow is an unhandled MulterError, reaches
 * errorHandler as a non-ApiError, and surfaces as a 500 with no usable message
 * instead of a 400 telling the admin the file is too big.
 */
function handleUploadErrors(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(ApiError.badRequest(`File too large — the limit is ${env.MAX_UPLOAD_SIZE_MB} MB`));
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      next(ApiError.badRequest(`Too many files — the limit is ${MAX_FILES_PER_REQUEST} per upload`));
      return;
    }
    next(ApiError.badRequest(`Upload failed: ${err.message}`));
    return;
  }
  next(err);
}

const mediaWrite = [authMiddleware, requirePermission("news:write")];

/* ---------------- Reads ---------------- */

mediaRouter.get(
  "/",
  mediaWrite,
  asyncHandler(async (req, res) => mediaController.listMedia(req, res))
);

/* ---------------- Writes ---------------- */

/**
 * any() accepts the part under any field name, so a client can post
 * "files" (many) or "file" (one) without the route caring which.
 */
mediaRouter.post(
  "/",
  mediaWrite,
  (req: Request, res: Response, next: NextFunction) =>
    upload.any()(req, res, (err: unknown) => handleUploadErrors(err, req, res, next)),
  asyncHandler(async (req, res) => mediaController.uploadMedia(req, res))
);

mediaRouter.delete(
  "/:filename",
  mediaWrite,
  asyncHandler(async (req, res) => mediaController.deleteMedia(req, res))
);
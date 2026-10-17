import type { Request, Response } from "express";

import { audit } from "../activity-log/activity-log.service.js";
import * as mediaService from "./media.service.js";

/**
 * Auth is already guaranteed by authMiddleware + requirePermission on every
 * route below, so this only guards against a future route being wired without
 * them. Mirrors the defensive requireActor in news.controller.
 */
function requireActor(req: Request): boolean {
  return req.user !== undefined;
}

/** GET /api/media - every file in the upload directory, newest first. */
export async function listMedia(req: Request, res: Response): Promise<void> {
  if (!requireActor(req)) return;
  const files = await mediaService.listMedia();
  res.status(200).json({ files, total: files.length });
}

/**
 * POST /api/media - multipart upload into the uploads directory.
 *
 * Accepts many files in one request (field name "files") as well as a single
 * file under "file", so both the multi-select picker and a plain one-file POST
 * work without the client caring which it sent.
 */
export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!requireActor(req)) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
    return;
  }

  // req.files is either File[] (single() / array()) or a keyed map (fields()).
  // Normalise both shapes into one list.
  const incoming: Express.Multer.File[] = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files ?? {}).flat();
  if (req.file) incoming.push(req.file);
  if (incoming.length === 0) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message:
          'No file received — send multipart/form-data under "files" (many) or "file" (one)',
      },
    });
    return;
  }

  // Only the generated names are ever echoed back; client filenames are not
  // trusted and are not stored as-is.
  const files = incoming.map((file) => ({
    filename: file.filename,
    url: `/uploads/${encodeURIComponent(file.filename)}`,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  }));

  audit(req, {
    action: "media.upload",
    entity: "media",
    entityId: files.map((f) => f.filename).join(","),
  });

  res.status(201).json({ files, total: files.length });
}

/** DELETE /api/media/:filename */
export async function deleteMedia(req: Request, res: Response): Promise<void> {
  if (!requireActor(req)) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
    return;
  }
  const { filename } = req.params as { filename: string };
  await mediaService.deleteMedia(filename);
  audit(req, { action: "media.delete", entity: "media", entityId: filename });
  res.status(200).json({ deleted: filename });
}
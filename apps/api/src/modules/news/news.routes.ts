import { Router } from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import path from "node:path";

import { env } from "../../core/config/env.js";
import { authMiddleware, optionalAuthMiddleware } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as newsController from "./news.controller.js";
import {
  articleSlugParamsSchema,
  createArticleSchema,
  createGallerySchema,
  createReelSchema,
  featuredArticlesQuerySchema,
  idParamsSchema,
  listArticlesQuerySchema,
  listGalleriesQuerySchema,
  listReelsQuerySchema,
  updateArticleSchema,
  updateGallerySchema,
  updateReelSchema,
} from "./news.schema.js";

/**
 * Module 7 — News & Media routes (Section 8: CRUD article/reel/gallery ·
 * upload media · get featured · get by tag · publish/unpublish).
 *
 * Reads are public and return published content only; optional auth lets a
 * content_manager read drafts through the same endpoints. Writes are gated on
 * the central "news:write" permission (Section 7).
 */
export const newsRouter = Router();

/** Image/video mime allowlist + size cap + random filenames (Section 9 security). */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, env.UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      // Generated name — the client filename never touches the filesystem.
      const ext = EXT_BY_MIME[file.mimetype] ?? ".bin";
      cb(null, `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

/* ---------------- Public reads (published only) ---------------- */

newsRouter.get(
  "/articles",
  optionalAuthMiddleware,
  validate({ query: listArticlesQuerySchema }),
  asyncHandler(newsController.listArticles)
);
newsRouter.get(
  "/articles/featured",
  validate({ query: featuredArticlesQuerySchema }),
  asyncHandler(newsController.getFeaturedArticles)
);
newsRouter.get("/articles/tags", asyncHandler(newsController.getArticleTags));
newsRouter.get(
  "/articles/:idOrSlug",
  optionalAuthMiddleware,
  validate({ params: articleSlugParamsSchema }),
  asyncHandler(newsController.getArticle)
);

newsRouter.get(
  "/reels",
  optionalAuthMiddleware,
  validate({ query: listReelsQuerySchema }),
  asyncHandler(newsController.listReels)
);
newsRouter.get(
  "/reels/:id",
  optionalAuthMiddleware,
  validate({ params: idParamsSchema }),
  asyncHandler(newsController.getReel)
);

newsRouter.get(
  "/galleries",
  optionalAuthMiddleware,
  validate({ query: listGalleriesQuerySchema }),
  asyncHandler(newsController.listGalleries)
);
newsRouter.get(
  "/galleries/:id",
  optionalAuthMiddleware,
  validate({ params: idParamsSchema }),
  asyncHandler(newsController.getGallery)
);

/* ---------------- Writes — news:write (content_manager) ---------------- */

const canWrite = [authMiddleware, requirePermission("news:write")] as const;

newsRouter.post("/articles", ...canWrite, validate({ body: createArticleSchema }), asyncHandler(newsController.createArticle));
newsRouter.put("/articles/:id", ...canWrite, validate({ params: idParamsSchema, body: updateArticleSchema }), asyncHandler(newsController.updateArticle));
newsRouter.post("/articles/:id/publish", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.publishArticle));
newsRouter.post("/articles/:id/unpublish", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.unpublishArticle));
newsRouter.delete("/articles/:id", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.deleteArticle));

newsRouter.post("/reels", ...canWrite, validate({ body: createReelSchema }), asyncHandler(newsController.createReel));
newsRouter.put("/reels/:id", ...canWrite, validate({ params: idParamsSchema, body: updateReelSchema }), asyncHandler(newsController.updateReel));
newsRouter.post("/reels/:id/publish", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.publishReel));
newsRouter.post("/reels/:id/unpublish", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.unpublishReel));
newsRouter.delete("/reels/:id", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.deleteReel));

newsRouter.post("/galleries", ...canWrite, validate({ body: createGallerySchema }), asyncHandler(newsController.createGallery));
newsRouter.put("/galleries/:id", ...canWrite, validate({ params: idParamsSchema, body: updateGallerySchema }), asyncHandler(newsController.updateGallery));
newsRouter.post("/galleries/:id/publish", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.publishGallery));
newsRouter.post("/galleries/:id/unpublish", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.unpublishGallery));
newsRouter.delete("/galleries/:id", ...canWrite, validate({ params: idParamsSchema }), asyncHandler(newsController.deleteGallery));

/* ---------------- Media upload ---------------- */

newsRouter.post("/upload", authMiddleware, requirePermission("news:write"), upload.single("file"), asyncHandler(newsController.uploadMedia));

export { upload as newsUpload };

/** Static serving of /uploads — mounted from app.ts so the path is explicit. */
export const uploadsDir = path.resolve(env.UPLOAD_DIR);
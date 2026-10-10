import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import { audit } from "../activity-log/activity-log.service.js";
import * as newsService from "./news.service.js";
import type {
  CreateArticleInput,
  CreateGalleryInput,
  CreateReelInput,
  ListArticlesQuery,
  ListGalleriesQuery,
  ListReelsQuery,
  UpdateArticleInput,
  UpdateGalleryInput,
  UpdateReelInput,
} from "./news.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

/**
 * Optional auth: public routes use this so a logged-in content_manager can
 * read drafts through the same endpoints. The service decides what the caller
 * is allowed to see — this only populates req.user when a token is present.
 */
function actor(req: Request): newsService.Actor | undefined {
  if (!req.user) return undefined;
  return { id: req.user.id, role: req.user.role };
}

function requireActor(req: Request): newsService.Actor {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

/* ---------------- Article ---------------- */

export async function createArticle(req: Request, res: Response): Promise<void> {
  const article = await newsService.createArticle(req.body as CreateArticleInput);
  audit(req, {
    action: "article.create",
    entity: "article",
    entityId: article.id,
    metadata: { title: article.title, category: article.category },
  });
  res.status(201).json({ article });
}

export async function updateArticle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const article = await newsService.updateArticle(id, req.body as UpdateArticleInput);
  audit(req, {
    action: "article.update",
    entity: "article",
    entityId: article.id,
    metadata: { fields: Object.keys(req.body as object) },
  });
  res.status(200).json({ article });
}

export async function publishArticle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const article = await newsService.publishArticle(id);
  audit(req, { action: "article.publish", entity: "article", entityId: article.id });
  res.status(200).json({ article });
}

export async function unpublishArticle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const article = await newsService.unpublishArticle(id);
  audit(req, { action: "article.unpublish", entity: "article", entityId: article.id });
  res.status(200).json({ article });
}

export async function deleteArticle(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await newsService.deleteArticle(id);
  audit(req, { action: "article.delete", entity: "article", entityId: id });
  res.status(200).json(result);
}

export async function getArticle(req: Request, res: Response): Promise<void> {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const article = await newsService.getArticle(idOrSlug, actor(req));
  res.status(200).json({ article });
}

export async function listArticles(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListArticlesQuery;
  const result = await newsService.listArticles(query, actor(req));
  res.status(200).json(result);
}

export async function getFeaturedArticles(req: Request, res: Response): Promise<void> {
  const { limit } = req.query as unknown as { limit: number };
  const articles = await newsService.getFeaturedArticles(limit);
  res.status(200).json({ articles });
}

export async function getArticleTags(_req: Request, res: Response): Promise<void> {
  const tags = await newsService.getArticleTags();
  res.status(200).json({ tags });
}

/* ---------------- Reel ---------------- */

export async function createReel(req: Request, res: Response): Promise<void> {
  const reel = await newsService.createReel(req.body as CreateReelInput);
  audit(req, { action: "reel.create", entity: "reel", entityId: reel.id, metadata: { title: reel.title } });
  res.status(201).json({ reel });
}

export async function updateReel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const reel = await newsService.updateReel(id, req.body as UpdateReelInput);
  audit(req, {
    action: "reel.update",
    entity: "reel",
    entityId: reel.id,
    metadata: { fields: Object.keys(req.body as object) },
  });
  res.status(200).json({ reel });
}

export async function publishReel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const reel = await newsService.publishReel(id);
  audit(req, { action: "reel.publish", entity: "reel", entityId: reel.id });
  res.status(200).json({ reel });
}

export async function unpublishReel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const reel = await newsService.unpublishReel(id);
  audit(req, { action: "reel.unpublish", entity: "reel", entityId: reel.id });
  res.status(200).json({ reel });
}

export async function deleteReel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await newsService.deleteReel(id);
  audit(req, { action: "reel.delete", entity: "reel", entityId: id });
  res.status(200).json(result);
}

export async function getReel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const reel = await newsService.getReel(id, actor(req));
  res.status(200).json({ reel });
}

export async function listReels(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListReelsQuery;
  const result = await newsService.listReels(query, actor(req));
  res.status(200).json(result);
}

/* ---------------- Gallery ---------------- */

export async function createGallery(req: Request, res: Response): Promise<void> {
  const gallery = await newsService.createGallery(req.body as CreateGalleryInput);
  audit(req, {
    action: "gallery.create",
    entity: "gallery",
    entityId: gallery.id,
    metadata: { title: gallery.title, images: gallery.images.length },
  });
  res.status(201).json({ gallery });
}

export async function updateGallery(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const gallery = await newsService.updateGallery(id, req.body as UpdateGalleryInput);
  audit(req, {
    action: "gallery.update",
    entity: "gallery",
    entityId: gallery.id,
    metadata: { fields: Object.keys(req.body as object) },
  });
  res.status(200).json({ gallery });
}

export async function publishGallery(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const gallery = await newsService.publishGallery(id);
  audit(req, { action: "gallery.publish", entity: "gallery", entityId: gallery.id });
  res.status(200).json({ gallery });
}

export async function unpublishGallery(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const gallery = await newsService.unpublishGallery(id);
  audit(req, { action: "gallery.unpublish", entity: "gallery", entityId: gallery.id });
  res.status(200).json({ gallery });
}

export async function deleteGallery(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await newsService.deleteGallery(id);
  audit(req, { action: "gallery.delete", entity: "gallery", entityId: id });
  res.status(200).json(result);
}

export async function getGallery(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const gallery = await newsService.getGallery(id, actor(req));
  res.status(200).json({ gallery });
}

export async function listGalleries(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListGalleriesQuery;
  const result = await newsService.listGalleries(query, actor(req));
  res.status(200).json(result);
}

/* ---------------- Media upload ---------------- */

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw ApiError.badRequest("No file received — send one file as multipart/form-data under \"file\"");
  }
  requireActor(req);
  // Only ever store the generated name, never the client-supplied one.
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    originalName: req.file.originalname,
  });
}
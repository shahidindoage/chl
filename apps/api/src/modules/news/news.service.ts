import type {
  ArticleDto,
  CreateArticleInput,
  CreateGalleryInput,
  CreateReelInput,
  GalleryDto,
  ListArticlesQuery,
  ListGalleriesQuery,
  ListReelsQuery,
  ReelDto,
  UpdateArticleInput,
  UpdateGalleryInput,
  UpdateReelInput,
} from "@tournament/shared";
import { slugify } from "@tournament/shared";

import { roleHasPermission } from "../../core/config/permissions.js";
import { ApiError } from "../../core/utils/ApiError.js";
import * as repo from "./news.repository.js";

/**
 * Module 7 — News & Media (Section 8).
 *
 * Visibility rule: articles/reels/galleries are public ONLY when
 * isPublished is true. Drafts are readable solely by callers holding
 * "news:write" (content_manager via news:*, super_admin via *), which is how
 * the admin editor previews a draft without it leaking to guests.
 */

export interface Actor {
  id: string;
  role: string;
}

const canWrite = (actor?: Actor) => Boolean(actor) && roleHasPermission(actor!.role as never, "news:write");

/** scope=all is admin-only; a guest asking for it is rejected, not downgraded. */
function resolveIncludeUnpublished(scope: "published" | "all", actor?: Actor): boolean {
  if (scope !== "all") return false;
  if (!canWrite(actor)) {
    throw ApiError.forbidden("Viewing drafts requires the content_manager role");
  }
  return true;
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function toArticleDto(a: repo.ArticleRow): ArticleDto {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    content: a.content,
    image: a.image,
    category: a.category,
    tags: a.tags,
    isFeatured: a.isFeatured,
    isPublished: a.isPublished,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function toReelDto(r: repo.ReelRow): ReelDto {
  return {
    id: r.id,
    title: r.title,
    videoUrl: r.videoUrl,
    thumbnail: r.thumbnail,
    isPublished: r.isPublished,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toGalleryDto(g: repo.GalleryRow): GalleryDto {
  return {
    id: g.id,
    title: g.title,
    matchId: g.matchId,
    isPublished: g.isPublished,
    publishedAt: g.publishedAt ? g.publishedAt.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    images: g.images.map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      sortOrder: img.sortOrder,
    })),
  };
}

/** Slug from title, suffixed on collision so two articles never clash. */
async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "article";
  let candidate = base;
  for (let i = 2; i < 200; i += 1) {
    const clash = await repo.findArticleBySlug(candidate);
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/* ---------------- Article ---------------- */

export async function createArticle(input: CreateArticleInput): Promise<ArticleDto> {
  return toArticleDto(
    await repo.createArticle({
      title: input.title,
      slug: await uniqueSlug(input.title),
      summary: input.summary ?? null,
      content: input.content,
      image: input.image ?? null,
      category: input.category,
      tags: input.tags,
      isFeatured: input.isFeatured,
    })
  );
}

export async function updateArticle(id: string, input: UpdateArticleInput): Promise<ArticleDto> {
  const existing = await repo.findArticleById(id);
  if (!existing) throw ApiError.notFound("Article not found");
  return toArticleDto(
    await repo.updateArticle(id, {
      title: input.title,
      slug: existing.slug, // slug is stable once published — links must not rot
      summary: input.summary ?? null,
      content: input.content,
      image: input.image ?? null,
      category: input.category,
      tags: input.tags,
      isFeatured: input.isFeatured,
    })
  );
}

export async function publishArticle(id: string): Promise<ArticleDto> {
  const existing = await repo.findArticleById(id);
  if (!existing) throw ApiError.notFound("Article not found");
  return toArticleDto(
    await repo.setArticlePublished(id, true, existing.publishedAt ?? new Date())
  );
}

export async function unpublishArticle(id: string): Promise<ArticleDto> {
  const existing = await repo.findArticleById(id);
  if (!existing) throw ApiError.notFound("Article not found");
  return toArticleDto(await repo.setArticlePublished(id, false, existing.publishedAt));
}

export async function deleteArticle(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findArticleById(id);
  if (!existing) throw ApiError.notFound("Article not found");
  await repo.deleteArticle(id);
  return { deleted: true, id };
}

/** Accepts a UUID or a slug — the public site links by slug. */
export async function getArticle(idOrSlug: string, actor?: Actor): Promise<ArticleDto> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const found = isUuid ? await repo.findArticleById(idOrSlug) : await repo.findArticleBySlug(idOrSlug);
  if (!found) throw ApiError.notFound("Article not found");
  if (!found.isPublished && !canWrite(actor)) throw ApiError.notFound("Article not found");
  return toArticleDto(found);
}

export async function listArticles(
  query: ListArticlesQuery,
  actor?: Actor
): Promise<{ items: ArticleDto[]; pagination: ReturnType<typeof pagination> }> {
  const includeUnpublished = resolveIncludeUnpublished(query.scope, actor);
  const { items, total } = await repo.listArticles({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    includeUnpublished,
    ...(query.category ? { category: query.category } : {}),
    ...(query.tag ? { tag: query.tag } : {}),
  });
  return { items: items.map(toArticleDto), pagination: pagination(query.page, query.limit, total) };
}

export async function getFeaturedArticles(limit: number): Promise<ArticleDto[]> {
  return (await repo.listFeaturedArticles(limit)).map(toArticleDto);
}

/** Dashboard aggregate, exposed for the admin module (it must not read prisma). */
export async function countContent(): Promise<{
  articles: number;
  publishedArticles: number;
  drafts: number;
  reels: number;
  galleries: number;
}> {
  return repo.countContent();
}

export async function getArticleTags(): Promise<string[]> {
  return repo.listArticleTags();
}

/* ---------------- Reel ---------------- */

export async function createReel(input: CreateReelInput): Promise<ReelDto> {
  return toReelDto(await repo.createReel({ title: input.title, videoUrl: input.videoUrl, thumbnail: input.thumbnail ?? null }));
}

export async function updateReel(id: string, input: UpdateReelInput): Promise<ReelDto> {
  const existing = await repo.findReelById(id);
  if (!existing) throw ApiError.notFound("Reel not found");
  return toReelDto(
    await repo.updateReel(id, { title: input.title, videoUrl: input.videoUrl, thumbnail: input.thumbnail ?? null })
  );
}

export async function publishReel(id: string): Promise<ReelDto> {
  const existing = await repo.findReelById(id);
  if (!existing) throw ApiError.notFound("Reel not found");
  return toReelDto(await repo.setReelPublished(id, true, existing.publishedAt ?? new Date()));
}

export async function unpublishReel(id: string): Promise<ReelDto> {
  const existing = await repo.findReelById(id);
  if (!existing) throw ApiError.notFound("Reel not found");
  return toReelDto(await repo.setReelPublished(id, false, existing.publishedAt));
}

export async function deleteReel(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findReelById(id);
  if (!existing) throw ApiError.notFound("Reel not found");
  await repo.deleteReel(id);
  return { deleted: true, id };
}

export async function getReel(id: string, actor?: Actor): Promise<ReelDto> {
  const found = await repo.findReelById(id);
  if (!found) throw ApiError.notFound("Reel not found");
  if (!found.isPublished && !canWrite(actor)) throw ApiError.notFound("Reel not found");
  return toReelDto(found);
}

export async function listReels(
  query: ListReelsQuery,
  actor?: Actor
): Promise<{ items: ReelDto[]; pagination: ReturnType<typeof pagination> }> {
  const includeUnpublished = resolveIncludeUnpublished(query.scope, actor);
  const { items, total } = await repo.listReels({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    includeUnpublished,
  });
  return { items: items.map(toReelDto), pagination: pagination(query.page, query.limit, total) };
}

/* ---------------- Gallery ---------------- */

export async function createGallery(input: CreateGalleryInput): Promise<GalleryDto> {
  return toGalleryDto(
    await repo.createGallery({
      title: input.title,
      matchId: input.matchId ?? null,
      images: input.images.map((i) => ({ url: i.url, caption: i.caption ?? null })),
    })
  );
}

export async function updateGallery(id: string, input: UpdateGalleryInput): Promise<GalleryDto> {
  const existing = await repo.findGalleryById(id);
  if (!existing) throw ApiError.notFound("Gallery not found");
  return toGalleryDto(
    await repo.updateGallery(id, {
      title: input.title,
      matchId: input.matchId ?? null,
      images: input.images.map((i) => ({ url: i.url, caption: i.caption ?? null })),
    })
  );
}

export async function publishGallery(id: string): Promise<GalleryDto> {
  const existing = await repo.findGalleryById(id);
  if (!existing) throw ApiError.notFound("Gallery not found");
  return toGalleryDto(await repo.setGalleryPublished(id, true, existing.publishedAt ?? new Date()));
}

export async function unpublishGallery(id: string): Promise<GalleryDto> {
  const existing = await repo.findGalleryById(id);
  if (!existing) throw ApiError.notFound("Gallery not found");
  return toGalleryDto(await repo.setGalleryPublished(id, false, existing.publishedAt));
}

export async function deleteGallery(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findGalleryById(id);
  if (!existing) throw ApiError.notFound("Gallery not found");
  await repo.deleteGallery(id);
  return { deleted: true, id };
}

export async function getGallery(id: string, actor?: Actor): Promise<GalleryDto> {
  const found = await repo.findGalleryById(id);
  if (!found) throw ApiError.notFound("Gallery not found");
  if (!found.isPublished && !canWrite(actor)) throw ApiError.notFound("Gallery not found");
  return toGalleryDto(found);
}

export async function listGalleries(
  query: ListGalleriesQuery,
  actor?: Actor
): Promise<{ items: GalleryDto[]; pagination: ReturnType<typeof pagination> }> {
  const includeUnpublished = resolveIncludeUnpublished(query.scope, actor);
  const { items, total } = await repo.listGalleries({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    includeUnpublished,
    ...(query.matchId ? { matchId: query.matchId } : {}),
  });
  return { items: items.map(toGalleryDto), pagination: pagination(query.page, query.limit, total) };
}
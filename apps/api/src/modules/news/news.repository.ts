import type { Article, Gallery, GalleryImage, NewsCategory, Reel } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Article / Reel / Gallery / GalleryImage
 * (Section 2 rule 2). Galleries hold a matchId but never join Match — that
 * label comes from the match module's service.
 */

export type ArticleRow = Article;
export type ReelRow = Reel;
export type GalleryRow = Gallery & { images: GalleryImage[] };
export type ArticleCategory = NewsCategory;

const articleIncludeNone = undefined;
void articleIncludeNone;

/* ---------------- Article ---------------- */

export function createArticle(data: {
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  image: string | null;
  category: ArticleCategory;
  tags: string[];
  isFeatured: boolean;
}): Promise<ArticleRow> {
  return prisma.article.create({ data });
}

export function findArticleById(id: string): Promise<ArticleRow | null> {
  return prisma.article.findUnique({ where: { id } });
}

export function findArticleBySlug(slug: string): Promise<ArticleRow | null> {
  return prisma.article.findUnique({ where: { slug } });
}

export function updateArticle(
  id: string,
  data: {
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    image: string | null;
    category: ArticleCategory;
    tags: string[];
    isFeatured: boolean;
  }
): Promise<ArticleRow> {
  return prisma.article.update({ where: { id }, data });
}

export function setArticlePublished(
  id: string,
  isPublished: boolean,
  publishedAt: Date | null
): Promise<ArticleRow> {
  return prisma.article.update({ where: { id }, data: { isPublished, publishedAt } });
}

export function deleteArticle(id: string): Promise<ArticleRow> {
  return prisma.article.delete({ where: { id } });
}

export function listArticles(params: {
  skip: number;
  take: number;
  includeUnpublished: boolean;
  category?: string;
  tag?: string;
}): Promise<{ items: ArticleRow[]; total: number }> {
  const where = {
    ...(params.includeUnpublished ? {} : { isPublished: true }),
    ...(params.category ? { category: params.category as ArticleCategory } : {}),
    ...(params.tag ? { tags: { has: params.tag } } : {}),
  };
  return Promise.all([
    prisma.article.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.article.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

/** Dashboard aggregate — read by the admin module via newsService (rule 2). */
export function countContent(): Promise<{
  articles: number;
  publishedArticles: number;
  drafts: number;
  reels: number;
  galleries: number;
}> {
  return Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.article.count({ where: { isPublished: false } }),
    prisma.reel.count({ where: { isPublished: true } }),
    prisma.gallery.count({ where: { isPublished: true } }),
  ]).then(([articles, publishedArticles, drafts, reels, galleries]) => ({
    articles,
    publishedArticles,
    drafts,
    reels,
    galleries,
  }));
}

export function listFeaturedArticles(take: number): Promise<ArticleRow[]> {
  return prisma.article.findMany({
    where: { isPublished: true, isFeatured: true },
    take,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

/** Every distinct tag currently in use — powers the public tag filter. */
export async function listArticleTags(): Promise<string[]> {
  const rows = await prisma.article.findMany({
    where: { isPublished: true },
    select: { tags: true },
  });
  return [...new Set(rows.flatMap((r) => r.tags))].sort();
}

/* ---------------- Reel ---------------- */

export function createReel(data: { title: string; videoUrl: string; thumbnail: string | null }): Promise<ReelRow> {
  return prisma.reel.create({ data });
}

export function findReelById(id: string): Promise<ReelRow | null> {
  return prisma.reel.findUnique({ where: { id } });
}

export function updateReel(id: string, data: { title: string; videoUrl: string; thumbnail: string | null }): Promise<ReelRow> {
  return prisma.reel.update({ where: { id }, data });
}

export function setReelPublished(id: string, isPublished: boolean, publishedAt: Date | null): Promise<ReelRow> {
  return prisma.reel.update({ where: { id }, data: { isPublished, publishedAt } });
}

export function deleteReel(id: string): Promise<ReelRow> {
  return prisma.reel.delete({ where: { id } });
}

export function listReels(params: { skip: number; take: number; includeUnpublished: boolean }): Promise<{
  items: ReelRow[];
  total: number;
}> {
  const where = params.includeUnpublished ? {} : { isPublished: true };
  return Promise.all([
    prisma.reel.findMany({ where, skip: params.skip, take: params.take, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] }),
    prisma.reel.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

/* ---------------- Gallery ---------------- */

const galleryInclude = { images: { orderBy: { sortOrder: "asc" as const } } };

export function createGallery(data: {
  title: string;
  matchId: string | null;
  images: { url: string; caption: string | null }[];
}): Promise<GalleryRow> {
  return prisma.gallery.create({
    data: {
      title: data.title,
      matchId: data.matchId,
      images: { create: data.images.map((img, i) => ({ ...img, sortOrder: i })) },
    },
    include: galleryInclude,
  });
}

export function findGalleryById(id: string): Promise<GalleryRow | null> {
  return prisma.gallery.findUnique({ where: { id }, include: galleryInclude });
}

/** Images are replaced wholesale — an editor works on a whole set at a time. */
export function updateGallery(
  id: string,
  data: { title: string; matchId: string | null; images: { url: string; caption: string | null }[] }
): Promise<GalleryRow> {
  return prisma.$transaction(async (tx) => {
    await tx.galleryImage.deleteMany({ where: { galleryId: id } });
    return tx.gallery.update({
      where: { id },
      data: {
        title: data.title,
        matchId: data.matchId,
        images: { create: data.images.map((img, i) => ({ ...img, sortOrder: i })) },
      },
      include: galleryInclude,
    });
  });
}

export function setGalleryPublished(
  id: string,
  isPublished: boolean,
  publishedAt: Date | null
): Promise<GalleryRow> {
  return prisma.gallery.update({ where: { id }, data: { isPublished, publishedAt }, include: galleryInclude });
}

export function deleteGallery(id: string): Promise<GalleryRow> {
  return prisma.gallery.delete({ where: { id }, include: galleryInclude });
}

export function listGalleries(params: {
  skip: number;
  take: number;
  includeUnpublished: boolean;
  matchId?: string;
}): Promise<{ items: GalleryRow[]; total: number }> {
  const where = {
    ...(params.includeUnpublished ? {} : { isPublished: true }),
    ...(params.matchId ? { matchId: params.matchId } : {}),
  };
  return Promise.all([
    prisma.gallery.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: galleryInclude,
    }),
    prisma.gallery.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}
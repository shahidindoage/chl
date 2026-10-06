import type {
  ArticleDto,
  CreateArticleInput,
  CreateGalleryInput,
  CreateReelInput,
  GalleryDto,
  ReelDto,
  UpdateArticleInput,
  UpdateGalleryInput,
  UpdateReelInput,
} from "@tournament/shared";

import { http } from "./client.js";
import type { Paginated } from "./tournament.client.js";

/** Module 7 — typed functions 1:1 with apps/api news routes (Section 6). */

/** scope=all includes drafts and 403s without news:write. */
export type NewsScope = "published" | "all";

export interface UploadedMedia {
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
}

/* ---------------- Article ---------------- */

export async function listArticles(
  params: { page?: number; limit?: number; category?: string; tag?: string; scope?: NewsScope } = {}
): Promise<Paginated<ArticleDto>> {
  const { data } = await http.get<Paginated<ArticleDto>>("/news/articles", { params });
  return data;
}

export async function getArticle(idOrSlug: string): Promise<ArticleDto> {
  const { data } = await http.get<{ article: ArticleDto }>(`/news/articles/${idOrSlug}`);
  return data.article;
}

export async function getFeaturedArticles(limit = 4): Promise<ArticleDto[]> {
  const { data } = await http.get<{ articles: ArticleDto[] }>("/news/articles/featured", { params: { limit } });
  return data.articles;
}

export async function getArticleTags(): Promise<string[]> {
  const { data } = await http.get<{ tags: string[] }>("/news/articles/tags");
  return data.tags;
}

export async function createArticle(input: CreateArticleInput): Promise<ArticleDto> {
  const { data } = await http.post<{ article: ArticleDto }>("/news/articles", input);
  return data.article;
}

export async function updateArticle(id: string, input: UpdateArticleInput): Promise<ArticleDto> {
  const { data } = await http.put<{ article: ArticleDto }>(`/news/articles/${id}`, input);
  return data.article;
}

export async function publishArticle(id: string): Promise<ArticleDto> {
  const { data } = await http.post<{ article: ArticleDto }>(`/news/articles/${id}/publish`);
  return data.article;
}

export async function unpublishArticle(id: string): Promise<ArticleDto> {
  const { data } = await http.post<{ article: ArticleDto }>(`/news/articles/${id}/unpublish`);
  return data.article;
}

export async function deleteArticle(id: string): Promise<void> {
  await http.delete(`/news/articles/${id}`);
}

/* ---------------- Reel ---------------- */

export async function listReels(params: { page?: number; limit?: number; scope?: NewsScope } = {}): Promise<Paginated<ReelDto>> {
  const { data } = await http.get<Paginated<ReelDto>>("/news/reels", { params });
  return data;
}

export async function createReel(input: CreateReelInput): Promise<ReelDto> {
  const { data } = await http.post<{ reel: ReelDto }>("/news/reels", input);
  return data.reel;
}

export async function updateReel(id: string, input: UpdateReelInput): Promise<ReelDto> {
  const { data } = await http.put<{ reel: ReelDto }>(`/news/reels/${id}`, input);
  return data.reel;
}

export async function publishReel(id: string): Promise<ReelDto> {
  const { data } = await http.post<{ reel: ReelDto }>(`/news/reels/${id}/publish`);
  return data.reel;
}

export async function unpublishReel(id: string): Promise<ReelDto> {
  const { data } = await http.post<{ reel: ReelDto }>(`/news/reels/${id}/unpublish`);
  return data.reel;
}

export async function deleteReel(id: string): Promise<void> {
  await http.delete(`/news/reels/${id}`);
}

/* ---------------- Gallery ---------------- */

export async function listGalleries(
  params: { page?: number; limit?: number; matchId?: string; scope?: NewsScope } = {}
): Promise<Paginated<GalleryDto>> {
  const { data } = await http.get<Paginated<GalleryDto>>("/news/galleries", { params });
  return data;
}

export async function getGallery(id: string): Promise<GalleryDto> {
  const { data } = await http.get<{ gallery: GalleryDto }>(`/news/galleries/${id}`);
  return data.gallery;
}

export async function createGallery(input: CreateGalleryInput): Promise<GalleryDto> {
  const { data } = await http.post<{ gallery: GalleryDto }>("/news/galleries", input);
  return data.gallery;
}

export async function updateGallery(id: string, input: UpdateGalleryInput): Promise<GalleryDto> {
  const { data } = await http.put<{ gallery: GalleryDto }>(`/news/galleries/${id}`, input);
  return data.gallery;
}

export async function publishGallery(id: string): Promise<GalleryDto> {
  const { data } = await http.post<{ gallery: GalleryDto }>(`/news/galleries/${id}/publish`);
  return data.gallery;
}

export async function unpublishGallery(id: string): Promise<GalleryDto> {
  const { data } = await http.post<{ gallery: GalleryDto }>(`/news/galleries/${id}/unpublish`);
  return data.gallery;
}

export async function deleteGallery(id: string): Promise<void> {
  await http.delete(`/news/galleries/${id}`);
}

/* ---------------- Media upload ---------------- */

/** Multipart upload; returns the /uploads path to store on the entity. */
export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await http.post<UploadedMedia>("/news/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
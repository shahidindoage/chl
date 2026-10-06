import { z } from "zod";

export const NEWS_CATEGORIES = [
  "match_report",
  "preview",
  "league_update",
  "spotlight",
  "interview",
  "announcement",
] as const;
export type NewsCategoryName = (typeof NEWS_CATEGORIES)[number];

/** "Match Report" — for display. Storage stays snake_case. */
export function newsCategoryLabel(category: NewsCategoryName): string {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Media served from /uploads or an external URL. */
const mediaUrl = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((v) => v.startsWith("/uploads/") || /^https?:\/\//i.test(v), {
    message: "Must be an uploaded path (/uploads/...) or an http(s) URL",
  });

export const articleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  content: z.string(),
  image: z.string().nullable(),
  category: z.enum(NEWS_CATEGORIES),
  tags: z.array(z.string()),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ArticleDto = z.infer<typeof articleSchema>;

export const reelSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  videoUrl: z.string(),
  thumbnail: z.string().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ReelDto = z.infer<typeof reelSchema>;

export const galleryImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  caption: z.string().nullable(),
  sortOrder: z.number().int(),
});
export type GalleryImageDto = z.infer<typeof galleryImageSchema>;

export const gallerySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  matchId: z.string().uuid().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  images: z.array(galleryImageSchema),
});
export type GalleryDto = z.infer<typeof gallerySchema>;

/** Tag: lowercase slug-ish, stored as a plain string[] in Postgres. */
const tag = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Tag must be lowercase letters, numbers or dashes");

const articleFields = {
  title: z.string().trim().min(2, "Title is required").max(200),
  summary: z.string().trim().max(500).nullish(),
  content: z.string().trim().min(1, "Content is required").max(50_000),
  image: mediaUrl.nullish(),
  category: z.enum(NEWS_CATEGORIES).default("league_update"),
  tags: z.array(tag).max(10, "At most 10 tags").default([]),
  isFeatured: z.coerce.boolean().default(false),
};

export const createArticleSchema = z.object(articleFields);
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = z.object(articleFields);
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

const reelFields = {
  title: z.string().trim().min(2, "Title is required").max(200),
  videoUrl: mediaUrl,
  thumbnail: mediaUrl.nullish(),
};

export const createReelSchema = z.object(reelFields);
export type CreateReelInput = z.infer<typeof createReelSchema>;
export const updateReelSchema = z.object(reelFields);
export type UpdateReelInput = z.infer<typeof createReelSchema>;

const galleryFields = {
  title: z.string().trim().min(2, "Title is required").max(200),
  matchId: z.string().uuid("Match id must be a UUID").nullish(),
  images: z
    .array(
      z.object({
        url: mediaUrl,
        caption: z.string().trim().max(200).nullish(),
      })
    )
    .min(1, "A gallery needs at least one image")
    .max(60, "At most 60 images per gallery"),
};

export const createGallerySchema = z.object(galleryFields);
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export const updateGallerySchema = z.object(galleryFields);
export type UpdateGalleryInput = z.infer<typeof createGallerySchema>;

/**
 * `scope=all` includes drafts and is permission-gated in the service — a
 * guest asking for it gets a 403, not drafts.
 */
export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.enum(NEWS_CATEGORIES).optional(),
  tag: tag.optional(),
  scope: z.enum(["published", "all"]).default("published"),
});
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

export const featuredArticlesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(4),
});

export const listReelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  scope: z.enum(["published", "all"]).default("published"),
});
export type ListReelsQuery = z.infer<typeof listReelsQuerySchema>;

export const listGalleriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  matchId: z.string().uuid("Match id must be a UUID").optional(),
  scope: z.enum(["published", "all"]).default("published"),
});
export type ListGalleriesQuery = z.infer<typeof listGalleriesQuerySchema>;

export const idParamsSchema = z.object({ id: z.string().uuid("Id must be a UUID") });

export const articleSlugParamsSchema = z.object({
  idOrSlug: z.string().trim().min(1, "Article id or slug is required").max(220),
});

/** "Raipur Riders beat Bhilai" -> "raipur-riders-beat-bhilai" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}
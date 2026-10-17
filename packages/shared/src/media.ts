import { z } from "zod";

/**
 * One file in the uploads directory, as returned by GET /api/media.
 *
 * There is no database row for these: the directory listing is the source of
 * truth, so files uploaded by any route (including the news module's upload)
 * show up in the media library automatically.
 */
export const mediaFileSchema = z.object({
  /**
   * Name on disk, e.g. "team-logo-3f9a1c2b8d4e5f60.png".
   *
   * The stem is the admin's original filename with a random suffix appended,
   * so files stay recognisable while re-uploads cannot overwrite each other.
   */
  filename: z.string(),
  /** Public path, URL-encoded for safety. Serve-relative, not absolute. */
  url: z.string(),
  /** Guessed from the extension; null when unknown rather than guessed wrong. */
  mimeType: z.string().nullable(),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string().datetime(),
});
export type MediaFileDto = z.infer<typeof mediaFileSchema>;

export const mediaListSchema = z.object({
  files: z.array(mediaFileSchema),
  total: z.number().int().nonnegative(),
});
export type MediaListDto = z.infer<typeof mediaListSchema>;
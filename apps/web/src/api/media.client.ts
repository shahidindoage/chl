import type { MediaFileDto, MediaListDto } from "@tournament/shared";

import { API_BASE_URL, http } from "./client.js";

/**
 * Media library client.
 *
 * The files themselves are served by the API from /uploads, so the URLs here
 * are API-relative. absoluteUrl() converts them for "copy link" and for the
 * "open in new tab" target, which cannot resolve a bare /uploads path.
 */

export async function listMedia(): Promise<MediaFileDto[]> {
  const { data } = await http.get<MediaListDto>("/media");
  return data.files;
}

/** Multipart upload. Accepts several files in one request. */
export async function uploadMedia(files: File[]): Promise<MediaFileDto[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  const { data } = await http.post<MediaListDto>("/media", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.files;
}

export async function deleteMedia(filename: string): Promise<void> {
  await http.delete(`/media/${encodeURIComponent(filename)}`);
}

/** Turn an API-relative /uploads path into something a browser can open. */
export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  // API_BASE_URL is ".../api" — the uploads mount is its sibling.
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * The stored name is "<original stem>-<16 hex chars><ext>". Strip the suffix so
 * the admin sees the name they typed rather than the internal dedup token.
 */
export function displayName(filename: string): string {
  return filename.replace(/-[0-9a-f]{16}(\.[^.]+)$/, "$1") || filename;
}

/** Coarse kind for choosing a preview, matching the API's MIME table. */
export function mediaKind(mimeType: string | null, filename: string): "image" | "video" | "file" {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "avif", "svg", "ico"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return "file";
}

/** Human-readable byte size for the list. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
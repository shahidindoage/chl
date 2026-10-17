import type { MediaFileDto } from "@tournament/shared";
import { Check, Copy, ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiErrorMessage } from "../../api/client.js";
import * as mediaApi from "../../api/media.client.js";

/**
 * Media library admin page.
 *
 * Uploads land directly in the API's uploads directory and are listed from
 * disk, so this shows every media file on the server — not just the ones
 * uploaded through this screen. The two actions an editor actually needs are
 * per file: open it, and copy its absolute URL.
 */

export function MediaAdminPage() {
  const [files, setFiles] = useState<MediaFileDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    mediaApi
      .listMedia()
      .then((list) => {
        setFiles(list);
        setError(null);
      })
      .catch((err: unknown) => setError(apiErrorMessage(err)));
  }, []);

  useEffect(load, [load]);

  const upload = async (selected: FileList | File[] | null) => {
    const picked = Array.from(selected ?? []);
    if (picked.length === 0) return;

    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await mediaApi.uploadMedia(picked);
      setNotice(
        saved.length === 1
          ? `Uploaded ${mediaApi.displayName(saved[0].filename)}`
          : `Uploaded ${saved.length} files`
      );
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
      // Reset so re-picking the same file still fires onChange.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copy = async (file: MediaFileDto) => {
    const url = mediaApi.absoluteUrl(file.url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(file.filename);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard API needs a secure context; fall back to a selectable prompt.
      window.prompt("Copy the media URL:", url);
    }
  };

  const remove = async (filename: string) => {
    setError(null);
    try {
      await mediaApi.deleteMedia(filename);
      setNotice(`Deleted ${filename}`);
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err));
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Media Library</h1>
      
      {/* ---------- Dropzone ---------- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={`mb-4 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <Upload className="mx-auto mb-2 h-7 w-7 text-slate-400" />
        <p className="mb-3 text-sm text-slate-600">Drop files here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Choose files"}
        </button>
        <p className="mt-3 text-xs text-slate-500">Images, video, PDF, CSV — up to 20 files at a time.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}

      {/* ---------- Grid ---------- */}
      {files === null ? (
        <p className="text-sm text-slate-500">Loading media…</p>
      ) : files.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No media uploaded yet.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500">
            {files.length} file{files.length === 1 ? "" : "s"}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <li key={file.filename} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <Preview file={file} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800" title={file.filename}>
                    {mediaApi.displayName(file.filename)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {mediaApi.formatBytes(file.size)} · {new Date(file.uploadedAt).toLocaleString()}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <a
                      href={mediaApi.absoluteUrl(file.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </a>

                    <button
                      type="button"
                      onClick={() => void copy(file)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {copied === file.filename ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy link
                        </>
                      )}
                    </button>

                    {confirmDelete === file.filename ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void remove(file.filename)}
                          className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(file.filename)}
                        aria-label={`Delete ${file.filename}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Thumbnail for images, muted video for video, icon for everything else. */
function Preview({ file }: { file: MediaFileDto }) {
  const kind = mediaApi.mediaKind(file.mimeType, file.filename);
  const url = mediaApi.absoluteUrl(file.url);

  if (kind === "image") {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
      />
    );
  }
  if (kind === "video") {
    return <video src={url} className="h-16 w-16 shrink-0 rounded-lg border border-slate-200" muted />;
  }
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
      <FileText className="h-7 w-7 text-slate-400" />
    </span>
  );
}
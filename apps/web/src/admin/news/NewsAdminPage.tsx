import type { ArticleDto, CreateArticleInput, GalleryDto, ReelDto, UpdateArticleInput } from "@tournament/shared";
import { NEWS_CATEGORIES, newsCategoryLabel } from "@tournament/shared";
import { useCallback, useEffect, useState } from "react";

import * as newsApi from "../../api/news.client.js";
import { apiErrorMessage } from "../../api/client.js";

/**
 * Module 7 admin — content_manager only (Section 8: article editor,
 * reel upload, gallery manager).
 *
 * All lists request scope=all so drafts are visible here, and every row
 * exposes the publish/unpublish toggle that drives public visibility.
 */

type Tab = "articles" | "reels" | "galleries";

export function NewsAdminPage() {
  const [tab, setTab] = useState<Tab>("articles");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">News &amp; Media</h1>
      <p className="mb-4 text-sm text-slate-500">
        Drafts stay private until you publish them. Only published items appear on the public site.
      </p>

      <div className="mb-5 flex gap-2">
        {(
          [
            ["articles", "Articles"],
            ["reels", "Reels"],
            ["galleries", "Gallery"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? "bg-brand-600 text-white" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "articles" && <ArticlesTab />}
      {tab === "reels" && <ReelsTab />}
      {tab === "galleries" && <GalleriesTab />}
    </div>
  );
}

function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

/* ---------------- Articles ---------------- */

function ArticlesTab() {
  const [items, setItems] = useState<ArticleDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ArticleDto | "new" | null>(null);

  const load = useCallback(() => {
    newsApi
      .listArticles({ page: 1, limit: 50, scope: "all" })
      .then((d) => setItems(d.items))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  useEffect(load, [load]);

  const toggle = async (a: ArticleDto) => {
    await (a.isPublished ? newsApi.unpublishArticle(a.id) : newsApi.publishArticle(a.id));
    load();
  };

  const remove = async (a: ArticleDto) => {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    await newsApi.deleteArticle(a.id);
    load();
  };

  if (error) return <p className="alert-error">{error}</p>;
  if (editing) {
    return (
      <ArticleEditor
        article={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button className="btn-primary" onClick={() => setEditing("new")}>
          New article
        </button>
      </div>

      {!items ? (
        <p className="text-slate-400">Loading articles…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No articles yet — create the first one.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-slate-400">/{a.slug}</div>
                    {a.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.tags.map((t) => (
                          <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{newsCategoryLabel(a.category)}</td>
                  <td className="px-3 py-2">
                    <PublishBadge published={a.isPublished} />
                    {a.isFeatured && <span className="ml-1 text-[10px] font-bold text-amber-600">FEATURED</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => setEditing(a)}>
                      Edit
                    </button>
                    <button className="ml-3 text-xs font-semibold text-slate-600 hover:underline" onClick={() => void toggle(a)}>
                      {a.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button className="ml-3 text-xs font-semibold text-red-600 hover:underline" onClick={() => void remove(a)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ArticleEditor({
  article,
  onClose,
  onSaved,
}: {
  article: ArticleDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [image, setImage] = useState(article?.image ?? "");
  const [category, setCategory] = useState<string>(article?.category ?? "league_update");
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const payload: CreateArticleInput | UpdateArticleInput = {
      title,
      summary: summary || null,
      content,
      image: image || null,
      category: category as CreateArticleInput["category"],
      tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      isFeatured,
    };
    try {
      if (article) await newsApi.updateArticle(article.id, payload);
      else {
        const created = await newsApi.createArticle(payload);
        await newsApi.publishArticle(created.id);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-bold">{article ? "Edit article" : "New article"}</h2>
      {error && <p className="alert-error mb-3">{error}</p>}

      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="na-title">Title</label>
          <input id="na-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </div>
        <div>
          <label className="label" htmlFor="na-summary">Summary</label>
          <textarea id="na-summary" className="input" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} />
        </div>
        <div>
          <label className="label" htmlFor="na-content">Content</label>
          <textarea id="na-content" className="input font-mono text-sm" rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
          <p className="mt-1 text-xs text-slate-400">Separate paragraphs with a blank line.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="na-category">Category</label>
            <select id="na-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{newsCategoryLabel(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="na-tags">Tags</label>
            <input id="na-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="match-report, raipur" />
            <p className="mt-1 text-xs text-slate-400">Comma separated, lowercase.</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="na-image">Cover image URL</label>
          <input
            id="na-image"
            className="input"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://… or /uploads/…"
          />
          {image && <img src={image} alt="" className="mt-2 h-32 w-full rounded object-cover" />}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Feature on the homepage strip
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={() => void save()} disabled={busy}>
          {article ? "Save changes" : "Create & publish"}
        </button>
        <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}

/* ---------------- Reels ---------------- */

function ReelsTab() {
  const [items, setItems] = useState<ReelDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    newsApi.listReels({ page: 1, limit: 50, scope: "all" }).then((d) => setItems(d.items)).catch((e) => setError(apiErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const add = async () => {
    setBusy(true);
    try {
      const reel = await newsApi.createReel({ title, videoUrl, thumbnail: thumbnail || null });
      await newsApi.publishReel(reel.id);
      setTitle(""); setVideoUrl(""); setThumbnail("");
      load();
    } catch (e) {
      setError(apiErrorMessage(e, "Create failed"));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <div className="card mb-4">
        <h2 className="mb-3 text-lg font-bold">Add reel</h2>
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="nr-title">Title</label>
            <input id="nr-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="nr-url">Video URL</label>
            <input id="nr-url" className="input" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="/uploads/reel.mp4 or https://…" />
          </div>
          <div>
            <label className="label" htmlFor="nr-thumb">Thumbnail URL (optional)</label>
            <input id="nr-thumb" className="input" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary mt-3" onClick={() => void add()} disabled={busy || !title || !videoUrl}>
          {busy ? "Saving…" : "Add & publish"}
        </button>
      </div>

      {!items ? <p className="text-slate-400">Loading reels…</p> : items.length === 0 ? (
        <p className="text-sm text-slate-400">No reels yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <div key={r.id} className="card">
              {r.thumbnail && <img src={r.thumbnail} alt="" className="mb-2 h-28 w-full rounded object-cover" />}
              <div className="text-sm font-semibold">{r.title}</div>
              <div className="mt-1 flex items-center justify-between">
                <PublishBadge published={r.isPublished} />
                <span>
                  <button
                    className="text-xs font-semibold text-slate-600 hover:underline"
                    onClick={() => void (r.isPublished ? newsApi.unpublishReel(r.id) : newsApi.publishReel(r.id)).then(load)}
                  >
                    {r.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="ml-3 text-xs font-semibold text-red-600 hover:underline"
                    onClick={() => void newsApi.deleteReel(r.id).then(load)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Galleries ---------------- */

function GalleriesTab() {
  const [items, setItems] = useState<GalleryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    newsApi.listGalleries({ page: 1, limit: 50, scope: "all" }).then((d) => setItems(d.items)).catch((e) => setError(apiErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    const urls = imageUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    try {
      const g = await newsApi.createGallery({ title, images: urls.map((url) => ({ url })) });
      await newsApi.publishGallery(g.id);
      setTitle(""); setImageUrls("");
      load();
    } catch (e) {
      setError(apiErrorMessage(e, "Create failed"));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <div className="card mb-4">
        <h2 className="mb-3 text-lg font-bold">New gallery</h2>
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="ng-title">Title</label>
            <input id="ng-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ng-images">Image URLs — one per line</label>
            <textarea id="ng-images" className="input font-mono text-sm" rows={5} value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary mt-3" onClick={() => void add()} disabled={busy || !title || !imageUrls.trim()}>
          {busy ? "Saving…" : "Create & publish"}
        </button>
      </div>

      {!items ? <p className="text-slate-400">Loading galleries…</p> : items.length === 0 ? (
        <p className="text-sm text-slate-400">No galleries yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((g) => (
            <div key={g.id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{g.title}</h3>
                <PublishBadge published={g.isPublished} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {g.images.slice(0, 6).map((img) => (
                  <img key={img.id} src={img.url} alt={img.caption ?? ""} className="aspect-square w-full rounded object-cover" />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">{g.images.length} images</p>
              <div className="mt-2">
                <button
                  className="text-xs font-semibold text-slate-600 hover:underline"
                  onClick={() => void (g.isPublished ? newsApi.unpublishGallery(g.id) : newsApi.publishGallery(g.id)).then(load)}
                >
                  {g.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button
                  className="ml-3 text-xs font-semibold text-red-600 hover:underline"
                  onClick={() => void newsApi.deleteGallery(g.id).then(load)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
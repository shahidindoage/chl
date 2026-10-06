import type { ArticleDto } from "@tournament/shared";
import { NEWS_CATEGORIES, newsCategoryLabel } from "@tournament/shared";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as newsApi from "../api/news.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";
import { formatMatchDate } from "../lib/format.js";

/** Public news feed (Section 8 Module 7: news feed + detail page). */
const PAGE_SIZE = 9;

/** Keeps a broken thumbnail from leaving an empty card. */
const FALLBACK_IMAGE = "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey/hero.png";

export function NewsPage() {
  const [articles, setArticles] = useState<ArticleDto[] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [tag, setTag] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    newsApi.getArticleTags().then(setTags).catch(() => undefined);
  }, []);

  useEffect(() => {
    newsApi
      .listArticles({
        page,
        limit: PAGE_SIZE,
        ...(category !== "all" ? { category: category as ArticleDto["category"] } : {}),
        ...(tag ? { tag } : {}),
      })
      .then((d) => {
        setArticles(d.items);
        setTotal(d.pagination.total);
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }, [category, tag, page]);

  const reset = () => setPage(1);
  const shown = articles?.length ?? 0;

  return (
    <div>
      <PageHero
        title="Latest News"
        description="Match reports, previews and announcements from across the competition."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "News" }]}
      />

      {/* Filters */}
      <div className="mb-6 mt-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setCategory("all");
            setTag("");
            reset();
          }}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            category === "all" && !tag
              ? "border-pitch-orange-dark bg-pitch-orange text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-pitch-orange-dark hover:text-pitch-orange-dark"
          }`}
        >
          All
        </button>
        {NEWS_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setTag("");
              reset();
            }}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              category === c && !tag
                ? "border-pitch-orange-dark bg-pitch-orange text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-pitch-orange-dark hover:text-pitch-orange-dark"
            }`}
          >
            {newsCategoryLabel(c)}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tags</span>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTag(tag === t ? "" : t);
                reset();
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tag === t ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p className="alert-error">{error}</p>
      ) : !articles ? (
        <p className="text-slate-400">Loading news…</p>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No articles found</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Try a different category or clear the tag filter.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pitch-orange-dark shadow-sm">
                    {newsCategoryLabel(item.category)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <time>{formatMatchDate(item.publishedAt ?? item.createdAt)}</time>
                    <span>•</span>
                    <span>{Math.max(1, Math.ceil(item.content.length / 900))} min read</span>
                  </div>

                  <h2 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-navy transition-colors group-hover:text-pitch-orange-dark">
                    {item.title}
                  </h2>

                  {item.summary && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{item.summary}</p>
                  )}

                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pitch-orange-dark group-hover:underline">
                      <span>Read More</span>
                      <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {shown < total && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark"
              >
                <span>Load More</span>
                <span className="text-xs font-normal text-slate-400">({total - shown} more)</span>
                <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Showing {shown} of {total}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
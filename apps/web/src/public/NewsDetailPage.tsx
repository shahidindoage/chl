import type { ArticleDto } from "@tournament/shared";
import { newsCategoryLabel } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as newsApi from "../api/news.client.js";
import { apiErrorMessage } from "../api/client.js";
import { formatMatchDate } from "../lib/format.js";

/**
 * Public article page (Section 8: "news feed + detail page").
 * Resolves by slug so links stay readable and survive retitling.
 */
export function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    newsApi.getArticle(slug).then(setArticle).catch((err) => setError(apiErrorMessage(err)));
  }, [slug]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!article) return <p className="mt-8 text-slate-400">Loading article…</p>;

  return (
    <div>
      {/* <PageHero
        title={article.title}
        description={article.summary ?? undefined}
        breadcrumb={[
          { label: "Home", to: "/" },
          { label: "News", to: "/news" },
          { label: "Article" },
        ]}
        image={article.image ?? undefined}
      /> */}

      <article className="mx-auto mt-8 max-w-7xl">
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover shadow-sm"
          />
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 font-bold uppercase tracking-wider text-pitch-orange-dark">
            {newsCategoryLabel(article.category)}
          </span>
          <time>{formatMatchDate(article.publishedAt ?? article.createdAt)}</time>
          {article.tags.map((t) => (
            <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
              {t}
            </span>
          ))}
        </div>

        <h1 className="font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl lg:text-4xl">
          {article.title}
        </h1>

        {article.summary && (
          <p className="mt-4 border-l-[3px] border-pitch-orange-dark pl-4 text-base font-medium italic text-slate-600">
            {article.summary}
          </p>
        )}

        <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
          {article.content.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4">
          <Link to="/news" className="text-sm font-semibold text-pitch-orange-dark hover:underline">
            ← All news
          </Link>
        </div>
      </article>
    </div>
  );
}
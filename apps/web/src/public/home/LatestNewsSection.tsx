import type { ArticleDto } from "@tournament/shared";
import { newsCategoryLabel } from "@tournament/shared";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as newsApi from "../../api/news.client.js";
import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { formatMatchDate } from "../../lib/format.js";

/**
 * Homepage Latest News strip — Module 7 checkpoint "After News → Latest News
 * real". Shows the four most recent published articles.
 */
const PREVIEW_LIMIT = 4;

export function LatestNewsSection() {
  const [articles, setArticles] = useState<ArticleDto[] | null>(null);

  useEffect(() => {
    newsApi
      .listArticles({ page: 1, limit: PREVIEW_LIMIT })
      .then((d) => setArticles(d.items))
      .catch(() => setArticles([]));
  }, []);

  return (
    <section id="news-section" className="bg-pitch-cream py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionEyebrow label="League News" id="news-eyebrow" />
            <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">Latest News</h2>
          </div>

          <Link
            to="/news"
            className="group inline-flex self-start items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark sm:self-auto"
          >
            <span>View All News</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {!articles ? (
          <p className="text-sm text-slate-400">Loading news…</p>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <h3 className="text-base font-bold text-navy">No stories published yet</h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
              Match reports, previews and federation announcements will appear here as soon as the content team
              publishes them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="group flex cursor-pointer flex-col justify-between"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between pt-3.5">
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pitch-orange-dark">
                        {newsCategoryLabel(item.category)}
                      </span>
                      <time className="text-xs font-medium text-slate-400">
                        {formatMatchDate(item.publishedAt ?? item.createdAt)}
                      </time>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-navy transition-colors group-hover:text-pitch-orange-dark sm:text-[15px]">
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pitch-orange-dark group-hover:underline">
                      <span>Read More</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
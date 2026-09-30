import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { DUMMY_NEWS, NEWS_FALLBACK_IMAGE, type NewsItem } from "../../lib/dummyNews.js";
import { formatMatchDate } from "../../lib/format.js";

/** Cards shown in the homepage strip; /news has the full archive. */
const PREVIEW_LIMIT = 4;

/**
 * League news section, ported from the design reference. News is Module 7 and
 * has no backend yet, so the cards render placeholder content from
 * lib/dummyNews and open a reader modal.
 */
export function LatestNewsSection({ onSelectArticle }: { onSelectArticle: (item: NewsItem) => void }) {
  return (
    <section id="news-section" className="bg-pitch-cream py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionEyebrow label="League News" id="news-eyebrow" />
            <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">Latest News</h2>
            <p className="mt-2 text-xs text-slate-400">Sample articles — the news module is not published yet.</p>
          </div>

          <Link
            to="/news"
            className="group inline-flex self-start items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark sm:self-auto"
          >
            <span>View All News</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DUMMY_NEWS.slice(0, PREVIEW_LIMIT).map((item) => (
            <article
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className="group flex cursor-pointer flex-col justify-between"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = NEWS_FALLBACK_IMAGE;
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col justify-between pt-3.5">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    {/* <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pitch-orange-dark">
                      {item.category}
                    </span> */}
                    <time className="text-xs font-medium text-slate-400">{formatMatchDate(item.date)}</time>
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

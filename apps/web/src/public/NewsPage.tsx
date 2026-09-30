import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHero } from "../components/PageHero.js";
import { DUMMY_NEWS, NEWS_FALLBACK_IMAGE, type NewsItem } from "../lib/dummyNews.js";
import { formatMatchDate } from "../lib/format.js";
import { useHomeData } from "./home/HomeDataContext.js";

/**
 * News index. Module 7 has no backend yet, so this renders the placeholder
 * articles from lib/dummyNews, newest first, and opens the shared article
 * reader. Pagination is client-side for the same reason.
 */

const PAGE_SIZE = 6;

export function NewsPage() {
  const { openArticle } = useHomeData();
  const [shown, setShown] = useState(PAGE_SIZE);

  // Newest first.
  const sorted = useMemo(() => [...DUMMY_NEWS].sort((a, b) => b.date.localeCompare(a.date)), []);
  const visible = sorted.slice(0, shown);

  return (
    <div>
      <PageHero
        title="Latest News"
        description="Match reports, previews and announcements from across the competition."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "News" }]}
        // image="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80"
      />

      {visible.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No articles published yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Match reports and announcements will appear here as soon as the news module goes live.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <NewsCard key={item.id} item={item} onOpen={openArticle} />
            ))}
          </div>

          {visible.length < sorted.length && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShown((c) => c + PAGE_SIZE)}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark"
              >
                <span>Load More</span>
                <span className="text-xs font-normal text-slate-400">
                  ({sorted.length - visible.length} more)
                </span>
                <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Showing {visible.length} of {sorted.length}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NewsCard({ item, onOpen }: { item: NewsItem; onOpen: (n: NewsItem) => void }) {
  return (
    <article
      onClick={() => onOpen(item)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
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
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pitch-orange-dark shadow-sm">
          {item.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <time>{formatMatchDate(item.date)}</time>
          <span>•</span>
          <span>{item.readTime}</span>
        </div>

        <h2 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-navy transition-colors group-hover:text-pitch-orange-dark">
          {item.title}
        </h2>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{item.summary}</p>

        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pitch-orange-dark group-hover:underline">
            <span>Read More</span>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

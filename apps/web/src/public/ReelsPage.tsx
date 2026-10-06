import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import * as newsApi from "../api/news.client.js";
import { apiErrorMessage } from "../api/client.js";
import type { ReelDto } from "@tournament/shared";
import { PageHero } from "../components/PageHero.js";

/** Public reels feed — vertical-scroll video cards (Section 8). */
export function ReelsPage() {
  const [reels, setReels] = useState<ReelDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    newsApi.listReels({ page: 1, limit: 50 }).then((d) => setReels(d.items)).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <PageHero
        title="Reels"
        description="Short-form match clips and highlights from around the competition."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Reels" }]}
      />

      <div className="mt-8">
        {!reels ? (
          <p className="text-slate-400">Loading reels…</p>
        ) : reels.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No reels published yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Match clips will appear here once the content team publishes them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reels.map((reel) => (
              <button
                key={reel.id}
                onClick={() => setActive(reel.id)}
                className="group relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-slate-900 shadow-sm"
              >
                {reel.thumbnail ? (
                  <img src={reel.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900" />
                )}
                <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4">
                  <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 transition-transform group-hover:scale-110">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                  <span className="text-sm font-bold text-white">{reel.title}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
          role="presentation"
        >
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className="w-full max-w-md">
            <video
              src={reels?.find((r) => r.id === active)?.videoUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
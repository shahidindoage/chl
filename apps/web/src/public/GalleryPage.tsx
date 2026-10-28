import type { GalleryDto } from "@tournament/shared";
import { galleryThumbnailUrl } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as newsApi from "../api/news.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";
import { useSeo } from "../hooks/useSeo.js";

/** Public photo gallery: one card per album, photos open on the album page. */
export function GalleryPage() {
  useSeo();
  const [galleries, setGalleries] = useState<GalleryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    newsApi
      .listGalleries({ page: 1, limit: 50, sort: "oldest" })
      .then((d) => setGalleries(d.items))
      .catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <PageHero
        title=""
        description=""
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Gallery" }]}
        image="https://chhattisgarhhockeyleague.com/uploads/imgi_4_Photo_gallery_desktop_banner-b6e421ca3009fb26.png"
        imageMobile="https://chhattisgarhhockeyleague.com/uploads/imgi_5_photo_gallery_mobile_banner-c77eb687b39462db.png"
      />

      <div className="mt-8">
        {!galleries ? (
          <p className="text-slate-400">Loading gallery…</p>
        ) : galleries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No photos published yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Matchday galleries will appear here once the content team publishes them.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => {
              const cover = galleryThumbnailUrl(g);
              return (
                <Link
                  key={g.id}
                  to={`/gallery/${g.id}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt={g.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        No cover image
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {g.images.length} {g.images.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-navy transition-colors group-hover:text-pitch-orange-dark">
                      {g.title}
                    </h2>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

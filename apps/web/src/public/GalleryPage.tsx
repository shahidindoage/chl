import type { GalleryDto } from "@tournament/shared";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import * as newsApi from "../api/news.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";
import { useSeo } from "../hooks/useSeo.js";

/** Public photo gallery — grid with a lightbox (Section 8). */
export function GalleryPage() {
  useSeo();
  const [galleries, setGalleries] = useState<GalleryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; caption: string | null } | null>(null);

  useEffect(() => {
    newsApi
      .listGalleries({ page: 1, limit: 50 })
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

      <div className="mt-8 space-y-10">
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
          galleries.map((g) => (
            <section key={g.id}>
           
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {g.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setLightbox({ url: img.url, caption: img.caption })}
                    className="group aspect-square overflow-hidden rounded-lg bg-slate-100 shadow-sm"
                  >
                    <img
                      src={img.url}
                      alt={img.caption ?? ""}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close image"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption ?? ""} className="max-h-[80vh] w-auto rounded-lg" />
            {lightbox.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{lightbox.caption}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  );
}
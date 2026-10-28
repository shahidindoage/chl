import type { GalleryDto, GalleryImageDto } from "@tournament/shared";
import { galleryThumbnailUrl } from "@tournament/shared";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as newsApi from "../api/news.client.js";
import { apiErrorMessage } from "../api/client.js";
import { useSeo } from "../hooks/useSeo.js";
import { SITE_NAME, TITLE_SUFFIX } from "../lib/seo.js";

/** Same banner artwork as /gallery, with a dedicated phone crop. */
const GALLERY_BANNER =
  "https://chhattisgarhhockeyleague.com/uploads/Photo_gallery_details_desktop_banner-2dfc1cc57fb1e857.jpg";
// const GALLERY_BANNER_MOBILE =
//   "https://chhattisgarhhockeyleague.com/uploads/photo_gallery_details_mobile_banner-47663e6b411380af.jpg";

/** One album: every image inside the gallery, with a lightbox. */
export function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [gallery, setGallery] = useState<GalleryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<GalleryImageDto | null>(null);

  useSeo(
    gallery
      ? {
          title: `Gallery: ${gallery.title}${TITLE_SUFFIX}`,
          description: `${gallery.images.length} photos from ${gallery.title} — ${SITE_NAME}.`,
          path: `/gallery/${gallery.id}`,
          image: galleryThumbnailUrl(gallery) ?? undefined,
        }
      : undefined
  );

  useEffect(() => {
    if (!id) return;
    newsApi
      .getGallery(id)
      .then(setGallery)
      .catch((e) => setError(apiErrorMessage(e)));
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!gallery) return <p className="text-slate-400">Loading gallery…</p>;

  const photos = gallery.images.length;
  const photoCountLabel = `${photos} ${photos === 1 ? "photo" : "photos"}`;

  return (
    <div>
      {/* Album hero: same treatment as PageHero, but with the text stacked on
          top of the artwork on phones and overlaid on the left from sm up. */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-stone-200/60 bg-pitch-cream-warm">
        {/* <div className="sm:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-10">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy">{gallery.title}</h1>
            {photos > 0 && <p className="mt-2 text-sm text-slate-600">{photoCountLabel}</p>}
          </div>
          <img src={GALLERY_BANNER_MOBILE} alt="" aria-hidden="true" className="block h-auto w-full select-none" />
        </div> */}

        

<div className="relative">
  <img 
    src={galleryThumbnailUrl(gallery) || GALLERY_BANNER} 
    alt="" 
    aria-hidden="true" 
    className="block h-[420px] object-cover w-full select-none" 
  />
  <div className="absolute inset-0 flex items-center bg-gradient-to-r from-white/95 via-white/50 to-transparent">
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
      <div className="max-w-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight lg:text-[2.75rem]">
          {(() => {
            const words = gallery.title ? gallery.title.split(' ') : [];
            const midpoint = Math.ceil(words.length / 2);
            const firstHalf = words.slice(0, midpoint).join(' ');
            const secondHalf = words.slice(midpoint).join(' ');

            return (
              <>
                <span className="text-[#082844]">{firstHalf}</span>{' '}
                <span className="text-[#ED7010]">{secondHalf}</span>
              </>
            );
          })()}
        </h1>
        {photos > 0 && <p className="mt-2 max-w-2xl text-lg font-bold text-slate-600">{photoCountLabel}</p>}
      </div>
    </div>
  </div>
</div>
      </section>

      <Link
        to="/gallery"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-pitch-orange-dark"
      >
        ← All galleries
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.images.map((img) => (
          <button
            key={img.id}
            onClick={() => setLightbox(img)}
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
            {lightbox.caption && (
              <figcaption className="mt-3 text-center text-sm text-white/80">{lightbox.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  );
}

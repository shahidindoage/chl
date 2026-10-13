// import { ChevronRight } from "lucide-react";
// import { Link } from "react-router-dom";

import { LEAGUE_ASSETS } from "../lib/assets.js";

/**
 * Compact page header for interior routes: background image, breadcrumb and
 * page title. Deliberately lighter than the homepage hero — no eyebrow, no
 * subtext, no CTA.
 *
 * Uses the homepage hero's light treatment: a cream wash from the left so the
 * artwork still shows through on the right while the breadcrumb, title and the
 * transparent site header above it stay dark and legible.
 *
 * Artwork is an in-flow <img>, not a background-image, so the section is
 * sized by its images: uncapped below sm so portrait mobile banners keep
 * their natural ratio, and a fixed height from sm up with object-cover,
 * because banners vary too much in native aspect ratio to trust them
 * uncapped on desktop. `imageMobile` replaces the art below sm.
 *
 * Full-bleed: `w-screen` + `left-1/2 -translate-x-1/2` escapes AppShell's
 * `max-w-7xl` container (plain negative margins would only cancel the
 * padding). The site header is sticky and sits in flow, so the artwork simply
 * begins underneath it with no offset to cancel.
 */

export interface Crumb {
  label: string;
  to?: string;
}

export interface PageHeroProps {
  title: string;
  breadcrumb: Crumb[];
  description?: string;
  image?: string;
  /**
   * Separate artwork for phones. Wide banners crop badly at 375px, so pages
   * with a dedicated mobile asset pass it here and it replaces `image` below
   * the `sm` breakpoint. Omit it and mobile falls back to `image`.
   */
  imageMobile?: string;
  /** Anchor for the background image, e.g. "center" or "right center". */
  position?: string;
  /** Object-position for the mobile artwork. Defaults to `position`. */
  mobilePosition?: string;
}

export function PageHero({
  title,
  // breadcrumb,
  description,
  image,
  imageMobile,
  position = "center",
  mobilePosition,
}: PageHeroProps) {
  const art = image ?? LEAGUE_ASSETS.standingBanner;
  const mobileArt = imageMobile ?? art;

  // Not a background-image: an in-flow <img> contributes its intrinsic aspect
  // ratio to the section's height, so each banner shows at its own natural
  // proportion and nothing is cropped. Absolute layers are what forced a
  // hardcoded height before.
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-stone-200/60 bg-pitch-cream-warm">
      {/* Desktop artwork. Capped at a fixed height because banners vary widely
          in native aspect ratio and an uncapped in-flow image made some
          heroes very tall. object-cover crops rather than distorts. */}
      <img
        src={art}
        alt=""
        aria-hidden="true"
        className="hidden h-[260px] w-full select-none object-cover sm:h-[300px] sm:block lg:h-[420px]"
        style={{ objectPosition: position }}
      />

      {/* Phone artwork. Left uncapped so it keeps its natural ratio, which
          portrait mobile banners need in order to read properly. */}
      <img
        src={mobileArt}
        alt=""
        aria-hidden="true"
        className="block w-full select-none sm:hidden"
        style={{ objectPosition: mobilePosition ?? position }}
      />

      {/* Content overlays the artwork rather than sitting below it, so the
          title is vertically centred over the banner at any height. */}
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 sm:text-sm">
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {crumb.to && !last ? (
                    <Link
                      to={crumb.to}
                      className="transition-colors hover:text-pitch-orange-dark hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className={last ? "text-navy" : undefined}>
                      {crumb.label}
                    </span>
                  )}
                  {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                </li>
              );
            })}
          </ol>
        </nav> */}

        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>

        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>}
        </div>
      </div>
    </section>
  );
}

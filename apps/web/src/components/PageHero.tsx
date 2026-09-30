import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
 * Full-bleed: `w-screen` + `left-1/2 -translate-x-1/2` escapes AppShell's
 * `max-w-7xl` container (plain negative margins would only cancel the
 * padding), while `-mt-24 sm:-mt-28` cancels the fixed-header offset so the
 * artwork tucks under the site header. Body has `overflow-x: clip` to absorb
 * the 100vw/scrollbar discrepancy.
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
  /** Anchor for the background image, e.g. "center" or "right center". */
  position?: string;
}

export function PageHero({ title, breadcrumb, description, image, position = "center" }: PageHeroProps) {
  return (
    <section
      className="relative -mt-24 left-1/2 flex min-h-[300px] w-screen -translate-x-1/2 items-center overflow-hidden border-b border-stone-200/60 bg-pitch-cream-warm bg-cover sm:-mt-28 sm:min-h-[360px] lg:min-h-[420px]"
      style={{ backgroundImage: `url("${image ?? LEAGUE_ASSETS.standingBanner}")`, backgroundPosition: position }}
    >
      {/* Cream wash from the left keeps the breadcrumb and title dark and
          legible, mirroring the homepage hero. */}
      <div className="absolute inset-0 bg-gradient-to-r from-pitch-cream-warm/95 via-pitch-cream-warm/75 to-transparent lg:via-pitch-cream-warm/30 lg:w-3/5" />

      {/* Centred, with top padding kept generous so the fixed site header
          never overlaps the breadcrumb at the shortest breakpoint. */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
        <nav aria-label="Breadcrumb">
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
        </nav>

        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>

        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>}
      </div>
    </section>
  );
}

import type { TournamentDto } from "@tournament/shared";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { LEAGUE_ASSETS, LEAGUE_FALLBACK_NAME } from "../../lib/assets.js";

/**
 * Hero section ported from the design reference. The eyebrow binds to the
 * active tournament instead of a hardcoded league name, falling back to the
 * league brand when no tournament is active. The CTA opens the tournament's
 * format and rules.
 */
export function HeroSection({ tournament }: { tournament: TournamentDto | null }) {
  const eyebrow = tournament ? `${tournament.name} • ${tournament.season}` : LEAGUE_FALLBACK_NAME;
  const rulesHref = tournament ? `/tournaments/${tournament.id}` : "/tournaments";

  const subtext = tournament
    ? `A ${tournament.format.replace(/_/g, " ")} championship bringing together talent, passion and community through the spirit of hockey.`
    : "Bringing together talent, passion and community through the spirit of hockey.";

  return (
    <section
      id="hero-section"
      className="relative flex min-h-[500px] items-center overflow-hidden border-b border-stone-200/60 bg-pitch-cream-warm bg-cover bg-center bg-no-repeat sm:min-h-[560px] lg:min-h-[640px] lg:bg-[center_right]"
      style={{ backgroundImage: `url("${LEAGUE_ASSETS.heroBanner}")` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pitch-cream-warm/95 via-pitch-cream-warm/75 lg:via-pitch-cream-warm/30 lg:w-3/5 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="max-w-xl space-y-6 text-left lg:max-w-2xl">
          <div className="inline-flex items-center gap-2.5" id="hero-league-eyebrow">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch-orange-dark opacity-75 duration-1000" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch-orange-dark shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-orange-dark sm:text-sm">{eyebrow}</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.12] tracking-tight text-navy sm:text-5xl lg:text-[3.65rem]">
            More Than a Game, <br />
            <span className="text-[#15803d]">It&rsquo;s Our Pride</span>
          </h1>

          <p className="max-w-lg text-base font-normal leading-relaxed text-slate-700 sm:text-lg">{subtext}</p>

          <div className="pt-2">
            <Link
              id="hero-rules-cta"
              to={rulesHref}
              className="group inline-flex transform items-center gap-3 rounded-full bg-pitch-orange px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pitch-orange-dark hover:shadow-md"
            >
              <span>Format &amp; Rules</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] text-white" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

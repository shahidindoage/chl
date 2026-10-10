import type { TournamentDto } from "@tournament/shared";
import { useEffect, useState } from "react";

import { HERO_SLIDES, LEAGUE_FALLBACK_NAME } from "../../lib/assets.js";

/**
 * Hero section with a rotating background slider.
 *
 * The copy binds to the active tournament rather than a hardcoded league name.
 * Slides cross-fade on a timer; the timer pauses on hover and on focus so a
 * visitor reading the copy isn't left watching the artwork change underneath.
 */

const SLIDE_MS = 6000;

export function HeroSection({ tournament }: { tournament: TournamentDto | null }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const eyebrow = tournament ? `${tournament.name} • ${tournament.season}` : LEAGUE_FALLBACK_NAME;

  const subtext = tournament
    ? `A ${tournament.format.replace(/_/g, " ")} championship bringing together talent, passion and community through the spirit of hockey.`
    : "Bringing together talent, passion and community through the spirit of hockey.";

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      id="hero-section"
      className="relative flex min-h-[500px] items-center overflow-hidden border-b border-stone-200/60 bg-pitch-cream-warm bg-cover bg-center bg-no-repeat sm:min-h-[560px] lg:min-h-[640px] lg:bg-[center_right]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Homepage highlights"
    >
      {/* Every slide is stacked and cross-faded. No zoom, so the artwork keeps its
          own framing and there is nothing distracting behind the copy. */}
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src + i}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out lg:bg-[position:right_center] ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url("${src}")` }}
        />
      ))}

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

        

          </div>
      </div>
    </section>
  );
}
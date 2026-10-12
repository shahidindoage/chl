import type { TournamentDto } from "@tournament/shared";
import { useEffect, useState } from "react";

import {
  HERO_SLIDES_DESKTOP,
  HERO_SLIDES_MOBILE,
  LEAGUE_FALLBACK_NAME,
} from "../../lib/assets.js";
import { useIsDesktop } from "../../lib/useMediaQuery.js";

/**
 * Hero section with a rotating background slider.
 *
 * Separate slide sets for desktop and mobile (from hero.txt) — a wide desktop
 * banner crops badly on a phone, so each breakpoint gets art composed for it.
 * Only the active set is rendered, so a phone never downloads the 2MB desktop
 * files. The timer pauses on hover and on focus so a visitor reading the copy
 * isn't left watching the artwork change underneath.
 */

const SLIDE_MS = 6000;

export function HeroSection({ tournament }: { tournament: TournamentDto | null }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const isDesktop = useIsDesktop();

  const slides = isDesktop ? HERO_SLIDES_DESKTOP : HERO_SLIDES_MOBILE;

  // Copy currently commented out in the JSX below; kept here so restoring it is a
  // single uncomment rather than a rewrite.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const eyebrow = tournament ? `${tournament.name} • ${tournament.season}` : LEAGUE_FALLBACK_NAME;
  const subtext = tournament
    ? `A ${tournament.format.replace(/_/g, " ")} championship bringing together talent, passion and community through the spirit of hockey.`
    : "Bringing together talent, passion and community through the spirit of hockey.";
  // Both are rendered in the JSX below once the hero copy is restored.
  void eyebrow;
  void subtext;

  // Resize across the breakpoint: restart on the first slide of the new set.
  useEffect(() => {
    setIndex(0);
  }, [isDesktop]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  return (
    <section
      id="hero-section"
      className="relative flex min-h-[540px] items-center overflow-hidden border-b border-stone-200/60 bg-pitch-cream-warm bg-cover bg-center bg-no-repeat sm:min-h-[560px] lg:min-h-0 lg:aspect-[1680/639]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Homepage highlights"
    >
      {/* Desktop art is 1680x639 and `lg:aspect-[1680/639]` matches it exactly,
          so bg-cover never crops it. Mobile art is portrait (400x500) and keeps
          the height-driven layout above. */}
      {/* Every slide is stacked and cross-faded. No zoom, so the artwork keeps its
          own framing and there is nothing distracting behind the copy. */}
      {slides.map((src, i) => (
        <div
          key={src + i}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url("${src}")` }}
        />
      ))}
    </section>
  );
}
import { LEAGUE_ASSETS } from "../../lib/assets.js";

/**
 * Mid-page CTA banner. Currently renders the looping video only — the copy and
 * CTA are commented out, so `onExplore` is unused for now. Underscore-prefixed
 * so TypeScript's noUnusedParameters doesn't flag it while it stays wired up.
 */
export function CtaBanner({ onExplore: _onExplore }: { onExplore: () => void }) {
  return (
    <section id="cta-section" className="relative w-full overflow-hidden bg-pitch-cta-wash">
      {/* Background video, in normal flow at its intrinsic aspect ratio so it
          spans the full width uncropped and the section grows to match.
          Muted + inline + looping so it autoplays everywhere; the poster
          covers the frame while the video loads. */}
      <video
        className="block w-full"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={LEAGUE_ASSETS.ctaBanner}
        aria-hidden="true"
      >
        <source src={LEAGUE_ASSETS.ctaVideo} type="video/mp4" />
      </video>

      {/* Light wash so the navy copy stays readable over moving footage. */}
      {/* <div className="absolute inset-0 bg-pitch-cta-wash/70" /> */}

      {/* <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center space-y-3.5 px-4 text-center sm:space-y-4 sm:px-6 lg:px-8">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-orange-dark sm:text-sm">
          Be Part of the Action
        </span>

        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl lg:text-4xl">
          Support Your Team. Be Part of the League.
        </h2>

        <p className="max-w-xl text-sm font-normal text-slate-700 sm:text-base">
          Follow the matches, stay updated with the latest news and events.
        </p>

        <div className="pt-2">
          <button
            onClick={onExplore}
            className="group inline-flex transform items-center gap-2.5 rounded-full bg-pitch-orange px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pitch-orange-dark hover:shadow-md sm:text-base"
          >
            <span>Explore the League</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div> */}
    </section>
  );
}

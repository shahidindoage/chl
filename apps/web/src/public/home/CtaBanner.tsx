import { ArrowRight } from "lucide-react";

import { LEAGUE_ASSETS } from "../../lib/assets.js";

/** Mid-page CTA banner ported from the design reference. */
export function CtaBanner({ onExplore }: { onExplore: () => void }) {
  return (
    <section
      id="cta-section"
      className="relative w-full overflow-hidden bg-pitch-cta-wash bg-cover bg-center bg-no-repeat py-14 sm:py-20 lg:py-24"
      style={{ backgroundImage: `url("${LEAGUE_ASSETS.ctaBanner}")` }}
    >
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center space-y-3.5 px-4 text-center sm:space-y-4 sm:px-6 lg:px-8">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-orange-dark sm:text-sm">
          Be Part of the Action
        </span>

        <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl lg:text-4xl">
          Support Your Team. Be Part of the League.
        </h2>

        <p className="max-w-xl text-sm font-normal text-slate-600 sm:text-base">
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
      </div>
    </section>
  );
}

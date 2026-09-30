import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHero } from "../components/PageHero.js";

/**
 * Fans area — the home for supporter features. Predictions, quizzes,
 * fan scorecards and squad following are Module 8 and have no backend yet, so
 * this page carries the hero and an explicit in-progress state rather than
 * empty or fabricated content.
 */

export function FansPage() {
  return (
    <div>
      <PageHero
        title="Fans"
        description="Everything the supporters' area is going to offer — predictions, quizzes and following."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Fans" }]}
      />

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pitch-orange/10">
          <Sparkles className="h-7 w-7 text-pitch-orange-dark" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-navy sm:text-3xl">
          Page in progress
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
          The fans area is being built. Until it goes live, follow the latest news, match updates and points table on the <Link to="/" className="font-semibold text-pitch-orange-dark hover:underline">home page</Link>.
        </p>
        {/* <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-pitch-orange-dark">
          Coming in a future release
        </p> */}
      </div>
    </div>
  );
}

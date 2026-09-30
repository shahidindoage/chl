import type { MatchDto } from "@tournament/shared";
import { ArrowRight } from "lucide-react";

import { MatchCard } from "../../components/MatchCard.js";
import { SectionEyebrow } from "../../components/SectionEyebrow.js";

/** Recent results grid — same card as the fixtures page, FT variant. */
export function RecentResultsSection({
  matches,
  onViewAll,
  onSelectMatch,
}: {
  matches: MatchDto[];
  onViewAll: () => void;
  onSelectMatch: (m: MatchDto) => void;
}) {
  return (
    <section id="recent-results-section" className="bg-pitch-cream py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionEyebrow label="Latest Results" id="recent-results-eyebrow" />
            <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">Recent Matches</h2>
          </div>

          <button
            onClick={onViewAll}
            className="group inline-flex self-start items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark sm:self-auto"
          >
            <span>View All Results</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No results yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Completed matches and their final scorelines will show up here once results are recorded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {matches.map((match, idx) => (
              <MatchCard
                key={match.id}
                match={match}
                onSelect={onSelectMatch}
                highlight={idx === 0}
                cta="Match Details & Scorers →"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

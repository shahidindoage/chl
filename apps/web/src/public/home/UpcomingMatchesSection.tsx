import type { MatchDto } from "@tournament/shared";
import { ArrowRight } from "lucide-react";

import { MatchCard } from "../../components/MatchCard.js";
import { SectionEyebrow } from "../../components/SectionEyebrow.js";

/** Upcoming matches grid ported from the design reference. */
export function UpcomingMatchesSection({
  matches,
  onViewAll,
  onSelectMatch,
}: {
  matches: MatchDto[];
  onViewAll: () => void;
  onSelectMatch: (m: MatchDto) => void;
}) {
  return (
    <section id="upcoming-matches-section" className="bg-pitch-cream py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionEyebrow label="Upcoming Matches" id="upcoming-matches-eyebrow" />
            <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">Next Matches</h2>
          </div>

          <button
            onClick={onViewAll}
            className="group inline-flex self-start items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark sm:self-auto"
          >
            <span>View All Matches</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No upcoming fixtures scheduled</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Once the tournament schedule is published, the next matches will appear right here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onSelect={onSelectMatch} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

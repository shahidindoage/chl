import type { StandingsDto } from "@tournament/shared";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { TeamCrest } from "../../components/TeamCrest.js";
import { LEAGUE_ASSETS } from "../../lib/assets.js";

/**
 * Points table section ported from the design reference. The table is
 * deliberately constrained to ~56% width on large screens so the player
 * artwork on the right stays visible, with a translucent wash on mobile
 * where the table covers it.
 */
export function StandingsSection({ standings }: { standings: StandingsDto | null }) {
  const rows = standings?.rows ?? [];

  return (
    <section
      id="standings-section"
      className="relative overflow-hidden bg-pitch-cream-soft bg-cover bg-right bg-no-repeat py-10 sm:py-14 lg:bg-center lg:py-16"
      style={{ backgroundImage: `url("${LEAGUE_ASSETS.standingBanner}")` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-pitch-cream-soft/85 lg:hidden" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <SectionEyebrow label="League Standings" id="standings-eyebrow" />
            <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl lg:text-[2.75rem]">
              Points Table
            </h2>
          </div>

          <Link
            to="/standings"
            className="hidden items-center gap-2 rounded-full border border-slate-700/50 bg-white/80 px-5 py-2 text-xs font-medium text-slate-800 shadow-sm transition-all hover:border-slate-900 hover:bg-white sm:inline-flex lg:text-sm"
          >
            <span>View Full Standings</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>

        <div className="w-full lg:max-w-[56%]">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:p-2.5">
            {rows.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <p className="text-sm font-semibold text-slate-700">No standings yet</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                  The table builds itself as soon as the first results are recorded.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 font-bold text-slate-500">
                      <th className="w-8 py-3 pl-4 pr-2 text-center">#</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-2.5 py-3 text-center">P</th>
                      <th className="px-2.5 py-3 text-center">W</th>
                      <th className="px-2.5 py-3 text-center">D</th>
                      <th className="px-2.5 py-3 text-center">L</th>
                      <th className="px-2.5 py-3 text-center">GD</th>
                      <th className="py-3 pl-2 pr-4 text-right font-extrabold text-navy">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const isLeader = row.position === 1;
                      return (
                        <tr
                          key={row.teamId}
                          className={`relative cursor-pointer transition-colors hover:bg-orange-50/40 ${isLeader ? "bg-emerald-50/20 font-medium" : ""}`}
                        >
                          <td className="relative py-3 pl-4 pr-2 text-center font-bold text-slate-700">
                            {isLeader && <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-[#16a34a]" />}
                            {row.position}
                          </td>

                          <td className="px-3 py-3">
                            <Link to={`/teams/${row.teamId}`} className="flex items-center gap-3">
                              <TeamCrest name={row.teamName} shortName={row.shortName} color1={row.color1} logo={row.logo} size="sm" />
                              <span className="whitespace-nowrap font-semibold text-navy transition-colors hover:text-pitch-orange-dark">
                                {row.teamName}
                              </span>
                            </Link>
                          </td>

                          <td className="px-2.5 py-3 text-center text-slate-600">{row.played}</td>
                          <td className="px-2.5 py-3 text-center text-slate-600">{row.won}</td>
                          <td className="px-2.5 py-3 text-center text-slate-600">{row.drawn}</td>
                          <td className="px-2.5 py-3 text-center text-slate-600">{row.lost}</td>
                          <td className="px-2.5 py-3 text-center font-medium text-slate-600">
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-right font-bold text-navy">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 text-center sm:hidden">
              <Link
                to="/standings"
                className="block w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View Full Standings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

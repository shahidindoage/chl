import type { StandingsDto } from "@tournament/shared";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { TeamCrest } from "../../components/TeamCrest.js";
import { LEAGUE_ASSETS } from "../../lib/assets.js";
import { visibleStandingsRows } from "../../lib/hidden-teams.js";

/**
 * Points table section ported from the design reference. The table is
 * deliberately constrained to ~56% width on large screens so the player
 * artwork on the right stays visible, with a translucent wash on mobile
 * where the table covers it.
 */
export function StandingsSection({ standings }: { standings: StandingsDto | null }) {
  // Same hide list as the standings page table, so the two can never disagree.
  const rows = visibleStandingsRows(standings?.rows ?? []);

// Both the art and the content occupy the same grid cell. The phone
  // image is in normal flow, so it sets the section's height from its own
  // aspect ratio; the content overlays it and only grows the section if the
  // table is taller than the artwork.
  return (
    <section id="standings-section" className="relative grid overflow-hidden bg-pitch-cream-soft">
      {/* Both banners are in normal flow and share a grid cell with the
          content, so each renders at its own aspect ratio and the section
          takes its height from the artwork instead of a fixed value.
          background-size: cover would crop both, which is why neither is a
          background-image any more. */}


      {/* Desktop art */}
      <img
        src={LEAGUE_ASSETS.standingsDesktop}
        alt=""
        aria-hidden="true"
        className="col-start-1 row-start-1 hidden w-full min-w-0 select-none sm:block"
      />

      {/* Phone art, and only this one below sm. */}
      <img
        src={LEAGUE_ASSETS.standingsMobile}
        alt=""
        aria-hidden="true"
        className="col-start-1 row-start-1 block w-full min-w-0 select-none sm:hidden"
      />

      {/* <div className="pointer-events-none absolute inset-0 bg-pitch-cream-soft/85 lg:hidden" /> */}

      {/* min-w-0 is load-bearing. As a grid item this element defaults to
          min-width:auto, which refuses to shrink below its content. The
          table's min-w-[560px] would then force this column to 560px wide on
          a 375px phone, overflow-x-auto below would have nothing to scroll,
          and the section's overflow-hidden would clip the right-hand columns.
          min-w-0 lets the column shrink so the scroll container works. */}
      <div className="relative z-10 col-start-1 row-start-1 min-w-0 pt-10 sm:pt-14 lg:pt-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <div className="w-full min-w-0 lg:max-w-[56%]">
          {/* Glass card: translucent white, backdrop blur and a light inner
              highlight along the top edge. Sits over the artwork at every
              width now that the desktop scrim was dropped. */}
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/55 p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150 sm:p-2.5">
            {rows.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <p className="text-sm font-semibold text-slate-700">No standings yet</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                  The table builds itself as soon as the first results are recorded.
                </p>
              </div>
            ) : (
              /* The wrapper scrolls; the table needs a floor width for that to have any
                 effect. With w-full it shrank to fit the phone instead of
                 overflowing, squeezing the eight columns unreadably.

                 The card is overflow-hidden for its rounded corners, which
                 also clipped the last column when the table reached the
                 right edge. No negative margin here, so the scroll viewport
                 stops inside the card, and the table carries its own right
padding so "Pts" is never flush against that edge. */
              /* min-w-0 again: this is the flex/block child that must be allowed to be
                 narrower than the table inside it. Same automatic-minimum-size
                 trap as the grid item above. */
              <div className="relative min-w-0 sm:[&_.standings-fade]:hidden">
                <div className="min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
                  <table className="w-max min-w-[560px] border-collapse text-left text-xs sm:w-full sm:min-w-0 sm:text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-white/70 font-bold text-slate-600">
                      <th className="w-8 py-3 pl-4 pr-2 text-center">#</th>
                      <th className="whitespace-nowrap px-3 py-3">Team</th>
                      <th className="px-2.5 py-3 text-center">P</th>
                      <th className="px-2.5 py-3 text-center">W</th>
                      <th className="px-2.5 py-3 text-center">D</th>
                      <th className="px-2.5 py-3 text-center">L</th>
                      <th className="px-2.5 py-3 text-center">GD</th>
                      <th className="py-3 pl-2 pr-4 text-right font-extrabold text-navy">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {rows.map((row) => {
                      const isLeader = row.position === 1;
                      return (
                        <tr
                          key={row.teamId}
                          className={`relative cursor-pointer transition-colors hover:bg-white/60 ${isLeader ? "bg-emerald-50/40 font-medium" : ""}`}
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

                {/* Right-edge fade, mobile only. Purely decorative, so it is
                    hidden from assistive tech. */}
                <div
                  aria-hidden="true"
                  className="standings-fade pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-pitch-cream-soft/90 to-transparent"
                />
              </div>
            )}

            {/* Scroll affordance: the table overflows below sm, which is not
                obvious on a touch device without a visible hint. */}
            

            <div className="pt-2 text-center sm:hidden">
              <Link
                to="/standings"
                className="block w-full rounded-lg border border-white/70 bg-white/50 py-2 text-xs font-medium text-slate-700 backdrop-blur-md transition-colors hover:bg-white/80"
              >
                View Full Standings →
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

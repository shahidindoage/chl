import type { MatchDto, TournamentDto } from "@tournament/shared";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import * as matchApi from "../api/match.client.js";
import * as tournamentApi from "../api/tournament.client.js";
import { apiErrorMessage } from "../api/client.js";
import { MatchCard } from "../components/MatchCard.js";
import { PageHero } from "../components/PageHero.js";
import { SectionEyebrow } from "../components/SectionEyebrow.js";

/** Cards revealed per section before "Load More". */
const PAGE_SIZE = 4;

/** How often the page re-syncs. Drives both the live strip and the buckets. */
const REFRESH_MS = 10_000;

/**
 * Public FE (Module 4): full match schedule, filterable by tournament and
 * status. Cards are the same MatchCard the homepage sections use, split into
 * upcoming (soonest first) and past (most recent first) sections. Each section
 * reveals PAGE_SIZE cards at a time, and a live strip sits at the top whenever
 * a match is in progress.
 */
export function MatchesPage() {
  const [matches, setMatches] = useState<MatchDto[] | null>(null);
  const [live, setLive] = useState<MatchDto[]>([]);
  const [tournaments, setTournaments] = useState<TournamentDto[]>([]);
  const [tFilter, setTFilter] = useState("");
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [upcomingShown, setUpcomingShown] = useState(PAGE_SIZE);
  const [pastShown, setPastShown] = useState(PAGE_SIZE);

  useEffect(() => {
    tournamentApi.listTournaments({ page: 1, limit: 50 }).then((d) => setTournaments(d.items)).catch(() => undefined);
  }, []);

  // One load for the whole page. The live strip used to poll on its own while
  // the section list only loaded once, so a match that went live appeared in
  // both places — or in neither — until a manual refresh. Fetching both from
  // a single pass keeps them consistent.
  const load = useCallback(async () => {
    const scope = tFilter ? { tournamentId: tFilter } : {};
    const [list, liveNow] = await Promise.all([
      matchApi.listMatches({ page: 1, limit: 100, ...scope, ...(status ? { status } : {}) }),
      // The live strip stays independent of the status dropdown, since it is
      // an alert about what is happening right now rather than a filter.
      matchApi.listMatches({ page: 1, limit: 10, status: "live", ...scope }),
    ]);
    setMatches(list.items);
    setLive(liveNow.items);
  }, [tFilter, status]);

  useEffect(() => {
    // A new filter means a new result set, so collapse both sections again.
    setUpcomingShown(PAGE_SIZE);
    setPastShown(PAGE_SIZE);
    load().catch((err) => setError(apiErrorMessage(err)));
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Don't burn requests on a backgrounded tab.
      if (document.hidden) return;
      load().catch(() => undefined);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // A live match is still in progress, so it belongs with the upcoming
  // fixtures; date-ascending naturally floats it to the top of that section.
  const byDateAsc = (a: MatchDto, b: MatchDto) => a.date.localeCompare(b.date);
  const byDateDesc = (a: MatchDto, b: MatchDto) => b.date.localeCompare(a.date);

  const liveIds = new Set(live.map((m) => m.id));
  const all = matches ?? [];
  const upcomingList = all
    .filter((m) => (m.status === "live" || m.status === "upcoming") && !liveIds.has(m.id))
    .sort(byDateAsc);
  const pastList = all
    .filter((m) => m.status === "completed" || m.status === "cancelled")
    .sort(byDateDesc);

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    );
  }

  return (
    <div>
      <PageHero
        title="Schedule &amp; Results"
        description="Every fixture across the tournament, from kickoff times to final scores."
        breadcrumb={[
          { label: "Home", to: "/" },
          { label: "Matches" },
        ]}
      />

      {/* Live strip — only rendered while a match is actually in progress. */}
      {live.length > 0 && (
        <section
          className="mt-8 mb-8 rounded-2xl"
          aria-label="Live matches"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-75 duration-1000" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-700 sm:text-sm">
                  Live Now
                </span>
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-extrabold text-navy sm:text-3xl">
                Live Matches
              </h2>
            </div>
            <span className="text-xs font-semibold text-red-500">
              {live.length} {live.length === 1 ? "match" : "matches"} in progress
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} to={`/matches/${m.id}/live`} />
            ))}
          </div>
        </section>
      )}

      {/* Filters — the page title now lives in the hero. */}
       <div className="hidden mb-8 flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-pitch-orange-dark"
          value={tFilter}
          onChange={(e) => setTFilter(e.target.value)}
          aria-label="Filter by tournament"
        >
          <option value="">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.season}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-pitch-orange-dark"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {!matches ? (
        <p className="text-slate-400">Loading schedule…</p>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No matches found</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Try clearing the tournament or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-14">
          {upcomingList.length > 0 && (
            <section>
              <div className="mt-20 mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <SectionEyebrow label="Next Fixtures" id="upcoming-eyebrow" />
                  <h2 className="mt-1.5 font-display text-2xl font-extrabold text-navy sm:text-3xl">
                    Upcoming Matches
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Showing {Math.min(upcomingShown, upcomingList.length)} of {upcomingList.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {upcomingList.slice(0, upcomingShown).map((m) => (
                  <MatchCard key={m.id} match={m} to={`/matches/${m.id}`} />
                ))}
              </div>
              <LoadMore
                shown={Math.min(upcomingShown, upcomingList.length)}
                total={upcomingList.length}
                onClick={() => setUpcomingShown((c) => c + PAGE_SIZE)}
              />
            </section>
          )}

          {pastList.length > 0 && (
            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <SectionEyebrow label="Final Scores" id="past-eyebrow" />
                  <h2 className="mt-1.5 font-display text-2xl font-extrabold text-navy sm:text-3xl">
                    Past Matches
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Showing {Math.min(pastShown, pastList.length)} of {pastList.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pastList.slice(0, pastShown).map((m) => (
                  <MatchCard key={m.id} match={m} to={`/matches/${m.id}`} />
                ))}
              </div>
              <LoadMore
                shown={Math.min(pastShown, pastList.length)}
                total={pastList.length}
                onClick={() => setPastShown((c) => c + PAGE_SIZE)}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LoadMore({ shown, total, onClick }: { shown: number; total: number; onClick: () => void }) {
  if (shown >= total) return null;
  const remaining = total - shown;
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-pitch-orange-dark hover:text-pitch-orange-dark"
      >
        <span>Load More</span>
        <span className="text-xs font-normal text-slate-400">
          ({remaining} more)
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
      </button>
    </div>
  );
}

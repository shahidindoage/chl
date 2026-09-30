import type { StandingsDto } from "@tournament/shared";
import { useEffect, useState } from "react";

import * as standingsApi from "../api/standings.client.js";
import * as tournamentApi from "../api/tournament.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";
import { StandingsTable } from "../components/StandingsTable.js";
import { LEAGUE_ASSETS } from "../lib/assets.js";

/** Public FE (Module 6): full points table, calculated + cached server-side. */
export function StandingsPage() {
  const [selected, setSelected] = useState<string>("");
  const [standings, setStandings] = useState<StandingsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The tournament picker is optional — with it hidden we simply resolve the
  // active tournament and show its table.
  useEffect(() => {
    tournamentApi.getActiveTournament()
      .then((t) => {
        if (t) setSelected(t.id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true); setError(null);
    standingsApi.getStandings(selected)
      .then(setStandings)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div>
      <PageHero
        title="Points Table"
        description="Standings are calculated from every completed match — win 3 points, draw 1, tie-break on goal difference then goals scored."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Standings" }]}
        image={LEAGUE_ASSETS.standingBanner}
        position="right center"
      />

      {/* Filters — the page title now lives in the hero. */}
      {/* <div className="mb-8 mt-8 flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-pitch-orange-dark"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Tournament"
        >
          <option value="">Select tournament…</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.season}
              {t.isActive ? " (active)" : ""}
            </option>
          ))}
        </select>

        {current && (
          <span className="rounded-full bg-pitch-orange/10 px-3 py-1.5 text-xs font-semibold text-pitch-orange-dark">
            {current.format.replace(/_/g, " ")} · {current.status}
          </span>
        )}
      </div> */}

      {error && <p className="alert-error mb-3">{error}</p>}
      {!selected ? (
        <p className="text-sm text-slate-400">Pick a tournament.</p>
      ) : loading ? (
        <p className="text-slate-400">Calculating…</p>
      ) : standings && (
        <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:p-2.5">
          <div className="overflow-x-auto">
            <StandingsTable standings={standings} />
          </div>
          <p className="px-3 py-3 text-xs text-slate-400">
            {standings.rows.reduce((s, r) => s + r.played, 0) / 2} matches played · win 3 pts, draw 1 pt ·
            tie-break: GD, then goals scored
          </p>
        </div>
      )}
    </div>
  );
}

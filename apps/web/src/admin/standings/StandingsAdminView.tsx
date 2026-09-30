import type { StandingsDto } from "@tournament/shared";
import { useEffect, useState } from "react";

import * as standingsApi from "../../api/standings.client.js";
import { apiErrorMessage } from "../../api/client.js";
import { StandingsTable } from "../../components/StandingsTable.js";

/** Admin FE (Module 6): read-only standings view (Section 8). */
export function StandingsAdminView() {
  const [standings, setStandings] = useState<StandingsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    standingsApi.getActiveStandings().then(setStandings).catch((err) => setError(apiErrorMessage(err)));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;
  if (!standings) return <p className="text-slate-400">Loading standings…</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Standings</h1>
      <p className="mb-4 text-sm text-slate-500">
        {standings.tournamentName} {standings.season} — read-only, computed from completed match results.
      </p>
      <div className="card overflow-x-auto p-0">
        <StandingsTable standings={standings} />
      </div>
    </div>
  );
}

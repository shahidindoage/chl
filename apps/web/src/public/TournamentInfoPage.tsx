import type { TournamentDto } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as api from "../api/tournament.client.js";
import { apiErrorMessage } from "../api/client.js";

/** Public FE (Module 1): tournament info / rules page. */
export function TournamentInfoPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getTournament(id).then(setTournament).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!tournament) return <p className="text-slate-400">Loading tournament…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-brand-600 hover:underline">← Home</Link>
      <div className="card mt-3">
        <div className="flex items-center gap-4">
          {tournament.logo && <img src={tournament.logo} alt="" className="h-16 w-16 rounded object-contain" />}
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-slate-500">{tournament.season} season</p>
          </div>
        </div>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex gap-2"><dt className="w-28 font-semibold text-slate-500">Format</dt><dd>{tournament.format.replace("_", " ")}</dd></div>
          <div className="flex gap-2"><dt className="w-28 font-semibold text-slate-500">Status</dt><dd>{tournament.status}</dd></div>
          <div className="flex gap-2"><dt className="w-28 font-semibold text-slate-500">Dates</dt><dd>{tournament.startDate.slice(0, 10)} → {tournament.endDate.slice(0, 10)}</dd></div>
        </dl>
        {tournament.rules && (
          <div className="mt-4 border-t pt-4">
            <h2 className="mb-1 font-bold">Rules</h2>
            <p className="whitespace-pre-line text-sm text-slate-600">{tournament.rules}</p>
          </div>
        )}
      </div>
    </div>
  );
}

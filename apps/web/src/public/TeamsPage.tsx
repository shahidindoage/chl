import type { TeamDto } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as teamApi from "../api/team.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";

/** Public FE (Module 2): teams directory grid, filterable by tournament. */
export function TeamsPage() {
  const [teams, setTeams] = useState<TeamDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi.listTeams({ page: 1, limit: 100 })
      .then((d) => setTeams(d.items))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <PageHero
        title="Teams"
        description="Every franchise in the competition — squads, coaches, form and full match history."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Teams" }]}
      />

      {/* Filters — the page title now lives in the hero. */}
      {/* <div className="mb-8 mt-8 flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-pitch-orange-dark"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Filter by tournament"
        >
          <option value="">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.season}
            </option>
          ))}
        </select>
        {teams && teams.length > 0 && (
          <span className="text-xs font-semibold text-slate-400">
            {teams.length} {teams.length === 1 ? "team" : "teams"}
          </span>
        )}
      </div> */}

      {!teams ? <p className="text-slate-400">Loading teams…</p> : teams.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No teams registered yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Teams appear here once they are registered against a tournament.
          </p>
        </div>
      ) : (
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <Link key={t.id} to={`/teams/${t.id}`} className="card flex items-center gap-3 hover:border-brand-500 hover:shadow-md">
              {t.logo ? (
                <img src={t.logo} alt="" className="h-12 w-12 rounded object-contain" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: t.color1 }}>
                  {t.shortName}
                </span>
              )}
              <div>
                <h2 className="font-bold">{t.name}</h2>
                <p className="text-xs text-slate-500">{t.shortName}{t.coachName ? ` · ${t.coachName}` : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import type { PlayerDto } from "@tournament/shared";
import { PLAYER_POSITIONS } from "@tournament/shared";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import * as playerApi from "../api/player.client.js";
import * as teamApi from "../api/team.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";
import type { TeamDto } from "@tournament/shared";

/** Public FE (Module 3): players directory with team/position filters + search. */
export function PlayersPage() {
  const [players, setPlayers] = useState<PlayerDto[] | null>(null);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi.listTeams({ page: 1, limit: 100 }).then((d) => setTeams(d.items)).catch(() => undefined);
  }, []);

  useEffect(() => {
    playerApi.listPlayers({
      page: 1,
      limit: 100,
      ...(teamFilter ? { teamId: teamFilter } : {}),
      ...(posFilter ? { position: posFilter } : {}),
    })
      .then((d) => setPlayers(d.items))
      .catch((err) => setError(apiErrorMessage(err)));
  }, [teamFilter, posFilter]);

  const shown = useMemo(() => {
    if (!players) return players;
    if (!search) return players;
    const q = search.toLowerCase();
    return players.filter((p) => `${p.name} ${p.nationality} #${p.jerseyNumber}`.toLowerCase().includes(q));
  }, [players, search]);

  const team = (id: string) => teams.find((t) => t.id === id);

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <PageHero
        title="Players"
        description="Every registered player in the competition — search by name, filter by team or position."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Players" }]}
        // image="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80"
      />

      {/* Filters sit on the right; the count anchors the left. */}
      <div className="mb-8 mt-8 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400">
          {shown ? `${shown.length} ${shown.length === 1 ? "player" : "players"}` : "Loading…"}
        </span>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-pitch-orange-dark"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            aria-label="Filter by team"
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-pitch-orange-dark"
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            aria-label="Filter by position"
          >
            <option value="">All positions</option>
            {PLAYER_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <input
            className="w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-pitch-orange-dark"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search players"
          />
        </div>
      </div>

      {!shown ? <p className="text-slate-400">Loading players…</p> : shown.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No players found</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Try a different search term, or clear the team and position filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const t = team(p.teamId);
            return (
              <Link key={p.id} to={`/players/${p.id}`} className="card flex items-center gap-3 hover:border-brand-500 hover:shadow-md">
                {p.image ? (
                  <img src={p.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: t?.color1 ?? "#64748b" }}>
                    #{p.jerseyNumber}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{p.name}</h2>
                  <p className="text-xs text-slate-500">
                    #{p.jerseyNumber} · {p.position} · {t?.shortName ?? ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

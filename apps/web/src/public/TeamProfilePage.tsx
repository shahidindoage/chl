import type { PlayerDto, TeamWithSponsorsDto } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as playerApi from "../api/player.client.js";
import * as teamApi from "../api/team.client.js";
import { apiErrorMessage } from "../api/client.js";

/** Public FE (Module 2 + 3): team profile — coach, sponsors, squad. */
export function TeamProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamWithSponsorsDto | null>(null);
  const [squad, setSquad] = useState<PlayerDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    teamApi.getTeam(id).then(setTeam).catch((err) => setError(apiErrorMessage(err)));
    playerApi.listPlayers({ page: 1, limit: 100, teamId: id })
      .then((d) => setSquad(d.items))
      .catch(() => undefined);
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!team) return <p className="text-slate-400">Loading team…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/teams" className="text-sm text-brand-600 hover:underline">← All teams</Link>
      <div className="card mt-3" style={{ borderTop: `4px solid ${team.color1}` }}>
        <div className="flex items-center gap-4">
          {team.logo ? (
            <img src={team.logo} alt="" className="h-16 w-16 rounded object-contain" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white" style={{ background: team.color1 }}>
              {team.shortName}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-sm text-slate-500">
              {team.shortName}
              {team.color2 && (
                <span className="ml-2 inline-flex gap-1 align-middle">
                  <span className="h-3 w-3 rounded-full border" style={{ background: team.color1 }} />
                  <span className="h-3 w-3 rounded-full border" style={{ background: team.color2 }} />
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h2 className="mb-2 font-bold">Coach</h2>
          {team.coachName || team.coachImage ? (
            <div className="flex items-center gap-3">
              {team.coachImage && <img src={team.coachImage} alt="" className="h-12 w-12 rounded-full object-cover" />}
              <p className="text-sm">{team.coachName ?? "Photo on file"}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No coach registered yet.</p>
          )}
        </div>

        <div className="mt-4 border-t pt-4">
          <h2 className="mb-2 font-bold">Sponsors</h2>
          {team.sponsors.length === 0 ? (
            <p className="text-sm text-slate-400">No sponsors yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {team.sponsors.map((s) => (
                <span key={s.id} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm">
                  {s.logo && <img src={s.logo} alt="" className="h-4 w-4 object-contain" />}
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-4">
          <h2 className="mb-2 font-bold">Squad</h2>
          {squad.length === 0 ? (
            <p className="text-sm text-slate-400">No players registered yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {squad.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-8 font-black" style={{ color: team.color1 }}>#{p.jerseyNumber}</span>
                  <span className="w-24 text-xs uppercase tracking-wide text-slate-500">{p.position}</span>
                  <Link to={`/players/${p.id}`} className="flex-1 font-medium text-brand-700 hover:underline">{p.name}</Link>
                  <span className="text-xs text-slate-400">{p.nationality}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

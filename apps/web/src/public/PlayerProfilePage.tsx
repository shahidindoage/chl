import type { PlayerProfileDto } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as playerApi from "../api/player.client.js";
import { apiErrorMessage } from "../api/client.js";

/** Public FE (Module 3): player profile page. */
export function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerProfileDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    playerApi.getPlayer(id).then(setPlayer).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!player) return <p className="text-slate-400">Loading player…</p>;

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/players" className="text-sm text-brand-600 hover:underline">← All players</Link>
      <div className="card mt-3" style={{ borderTop: `4px solid ${player.teamColor1}` }}>
        <div className="flex items-center gap-4">
          {player.image ? (
            <img src={player.image} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-black text-white" style={{ background: player.teamColor1 }}>
              #{player.jerseyNumber}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold">{player.name}</h1>
            <p className="text-sm text-slate-500">
              #{player.jerseyNumber} · {player.position} ·{" "}
              <Link to={`/teams/${player.teamId}`} className="text-brand-600 hover:underline">{player.teamName}</Link>
            </p>
          </div>
        </div>
        <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex gap-2"><dt className="w-28 font-semibold text-slate-500">Date of birth</dt><dd>{player.dateOfBirth.slice(0, 10)}</dd></div>
          <div className="flex gap-2"><dt className="w-28 font-semibold text-slate-500">Nationality</dt><dd>{player.nationality}</dd></div>
        </dl>
      </div>
    </div>
  );
}

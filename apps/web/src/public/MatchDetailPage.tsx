import type { MatchDetailDto } from "@tournament/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as matchApi from "../api/match.client.js";
import { apiErrorMessage } from "../api/client.js";

/** Public FE (Module 4): match detail — upcoming view + completed view. */
export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    matchApi.getMatch(id).then(setMatch).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!match) return <p className="text-slate-400">Loading match…</p>;

  const finished = match.status === "completed";

  const Team = ({ side }: { side: "a" | "b" }) => {
    const t = side === "a" ? match.teamA : match.teamB;
    const score = side === "a" ? match.teamAScore : match.teamBScore;
    return (
      <div className="flex flex-1 flex-col items-center gap-2">
        <span className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white" style={{ background: t.color1 }}>
          {t.shortName}
        </span>
        <Link to={`/teams/${t.id}`} className="text-center font-bold hover:underline">{t.name}</Link>
        {finished && <span className="text-3xl font-black">{score}</span>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/matches" className="text-sm text-brand-600 hover:underline">← Schedule</Link>
      {match.status === "live" && (
        <Link to={`/matches/${match.id}/live`} className="ml-3 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-700">
          ● Go to live view
        </Link>
      )}
      <div className="card mt-3">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          {match.status} · {new Date(match.date).toLocaleString()}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Team side="a" />
          <span className="text-2xl font-black text-slate-300">{finished ? "" : "vs"}</span>
          <Team side="b" />
        </div>
        {match.venue && (
          <p className="mt-4 text-center text-sm text-slate-500">
            📍 <Link to={`/venues/${match.venue.id}`} className="hover:underline">{match.venue.name}</Link>, {match.venue.city}
          </p>
        )}
        {finished && match.summary && <p className="mt-4 border-t pt-4 text-sm text-slate-600">{match.summary}</p>}
      </div>

      {finished && (
        <div className="card mt-4">
          <h2 className="mb-3 font-bold">Timeline</h2>
          {match.events.length === 0 ? <p className="text-sm text-slate-400">No events recorded.</p> : (
            <ul className="space-y-1">
              {match.events.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="w-10 font-bold text-slate-500">{e.minute}'</span>
                  <span className="w-24 capitalize">{e.eventType.replace("_", " ")}</span>
                  <span className="text-slate-600">{[e.teamName, e.playerName && `— ${e.playerName}`, e.description].filter(Boolean).join(" ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

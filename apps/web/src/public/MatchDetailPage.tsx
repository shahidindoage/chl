import type { MatchDetailDto } from "@tournament/shared";
import { MapPin } from "lucide-react";
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
        <span
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 bg-white"
        style={{ borderColor: t.color1 }}
      >
        {t.logo ? (
          <img src={t.logo} alt={`${t.name} logo`} className="h-12 w-12 object-contain" />
        ) : (
            <span className="text-lg font-black text-slate-900">{t.shortName}</span>
        )}
      </span>
        <Link
          to={`/teams/${t.id}`}
          className="text-center font-bold text-white drop-shadow hover:underline"
        >
          {t.name}
        </Link>
        {finished && <span className="text-3xl font-black text-white drop-shadow">{score}</span>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Link to="/matches" className="text-sm text-brand-600 hover:underline">← Back</Link>
      {match.status === "live" && (
        <Link to={`/matches/${match.id}/live`} className="ml-3 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-700">
          ● Go to live view
        </Link>
      )}
      <div className="card relative mt-3 overflow-hidden p-0">
        {/* Split-diagonal background, 45/55.
            The dividing line is slanted: it meets the top edge at 65% across
            and the bottom edge at 25% across. Team A takes the band to the
            left of that line, which averages (65+25)/2 = 45% of the width. */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: match.teamA.heroImage ? `url("${match.teamA.heroImage}")` : undefined,
              backgroundColor: match.teamA.color1,
              backgroundPosition: "left center",
              clipPath: "polygon(0 0, 65% 0, 25% 100%, 0 100%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: match.teamB.heroImage ? `url("${match.teamB.heroImage}")` : undefined,
              backgroundColor: match.teamB.color1,
              backgroundPosition: "right center",
              clipPath: "polygon(65% 0, 100% 0, 100% 100%, 25% 100%)",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="relative px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-white drop-shadow">
            {match.status} · {new Date(match.date).toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Team side="a" />
            <span className="text-2xl font-black text-white drop-shadow">{finished ? "" : "vs"}</span>
            <Team side="b" />
          </div>
        </div>

        {match.venue && (
          <p className="relative flex items-center justify-center gap-1.5 border-t border-white/20 bg-black/30 px-4 py-3 text-sm text-white sm:px-6">
            <MapPin className="h-4 w-4 shrink-0 text-white/80" aria-hidden="true" />
            <span>{match.venue.name}</span>
            <span>, {match.venue.city}</span>
          </p>
        )}
        {finished && match.summary && (
          <p className="relative border-t border-white/20 bg-black/30 px-4 py-4 text-sm text-white sm:px-6">
            {match.summary}
          </p>
        )}
      </div>

      {finished && (
        <div className="card mt-4">
          <h2 className="mb-3 font-bold">Timeline</h2>
          {match.events.length === 0 ? <p className="text-sm text-slate-400">No events recorded.</p> : (
            <ul className="space-y-1">
              {match.events.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:gap-2">
                  {/* Mobile: time + type on one line, description below.
                      Desktop (sm:contents): back to the original single row. */}
                  <div className="flex items-center gap-2 sm:contents">
                    <span className="shrink-0 whitespace-nowrap font-bold text-slate-500 sm:w-20">
                      {e.period ? `${e.period} · ` : ""}{e.minute}'
                    </span>
                    <span className="shrink-0 capitalize sm:w-24">{e.eventType.replace("_", " ")}</span>
                  </div>
                  <span className="min-w-0 text-slate-600 sm:flex-1">
                    {[e.teamName, e.playerName && `— ${e.playerName}`, e.description].filter(Boolean).join(" ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

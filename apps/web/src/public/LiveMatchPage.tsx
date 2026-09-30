import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { CommentaryDto, LiveStatusDto, MatchDetailDto } from "@tournament/shared";
import * as liveApi from "../api/live.client.js";
import * as matchApi from "../api/match.client.js";
import { apiErrorMessage } from "../api/client.js";
import { useLiveMatch } from "../sockets/useLiveMatch.js";

/** Public FE (Module 5): live match view — scoreboard, clock, commentary
 *  feed, building timeline. Sockets push updates; REST covers reconnect. */
export function LiveMatchPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<MatchDetailDto | null>(null);
  const [baseline, setBaseline] = useState<LiveStatusDto | null>(null);
  const [initialCommentary, setInitialCommentary] = useState<CommentaryDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    matchApi.getMatch(id).then(setDetail).catch((err) => setError(apiErrorMessage(err)));
    liveApi.getLiveFeed(id, { page: 1, limit: 50 })
      .then((f) => {
        setBaseline(f.status);
        setInitialCommentary(f.commentary);
      })
      .catch(() => undefined);
  }, [id]);

  const live = useLiveMatch(id, baseline);
  const status = live.status ?? baseline;
  const isLive = status?.status === "live";

  const merged = (() => {
    const seen = new Set(live.commentary.map((c) => c.id));
    return [...live.commentary, ...initialCommentary.filter((c) => !seen.has(c.id))];
  })();

  if (error) return <p className="alert-error">{error}</p>;
  if (!detail) return <p className="text-slate-400">Loading match…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/matches" className="text-sm text-brand-600 hover:underline">← Schedule</Link>
      <div className="card mt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {new Date(detail.date).toLocaleString()}
            {detail.venue && ` · ${detail.venue.name}, ${detail.venue.city}`}
          </p>
          {isLive && (
            <span className="flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              <span className={status?.isPaused ? "" : "animate-pulse"}>●</span>
              {status?.isPaused ? "PAUSED" : "LIVE"} {live.connected ? "" : "· offline"}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <span className="text-4xl font-black">{status?.teamAScore ?? detail.teamAScore}</span>
          <span className="text-slate-300">–</span>
          <span className="text-4xl font-black">{status?.teamBScore ?? detail.teamBScore}</span>
        </div>
        <p className="mt-1 text-center text-sm font-medium text-slate-500">
          {detail.teamA.name} <span className="text-slate-300">vs</span> {detail.teamB.name}
        </p>
        {isLive && (
          <p className="mt-2 text-center text-sm font-bold">
            {status?.currentPeriod ? `${status.currentPeriod} period · ` : ""}{status?.currentMinute ?? 0}′
          </p>
        )}
        {status?.status === "completed" && detail.summary && (
          <p className="mt-3 border-t pt-3 text-sm text-slate-600">{detail.summary}</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 font-bold">Timeline</h2>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {[...detail.events, ...live.events].map((e, i) => (
              <li key={`${e.id}-${i}`} className="flex gap-2 rounded bg-slate-50 px-2 py-1">
                <span className="font-bold">{e.minute}′</span>
                <span className="capitalize">{e.eventType.replace("_", " ")}</span>
                <span className="flex-1 truncate text-slate-600">{[e.teamName, e.playerName, e.description].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
            {detail.events.length === 0 && live.events.length === 0 && (
              <li className="text-slate-400">{isLive ? "Events appear live…" : "No events recorded."}</li>
            )}
          </ul>
        </section>
        <section className="card">
          <h2 className="mb-2 font-bold">Commentary</h2>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {merged.map((c) => (
              <li key={c.id} className="flex gap-2 rounded bg-slate-50 px-2 py-1">
                <span className="font-bold">{c.minute}′</span>
                <span className="flex-1">{c.text}</span>
              </li>
            ))}
            {merged.length === 0 && <li className="text-slate-400">{isLive ? "Waiting for commentary…" : "No commentary."}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

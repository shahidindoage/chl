import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import type { CommentaryDto, LiveStatusDto, MatchDetailDto, MatchEventDto } from "@tournament/shared";
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

  // The REST feed is newest-first (it returns the latest page), but a
  // commentary column reads chronologically, so reverse the snapshot and put
  // socket lines after it. Dedupe by id for the reconnect overlap, and drop
  // anything deleted over the socket.
  const merged = (() => {
    const seen = new Set(initialCommentary.map((c) => c.id));
    const deleted = new Set(live.deletedCommentaryIds);
    return [
      ...[...initialCommentary].reverse().filter((c) => !deleted.has(c.id)),
      ...live.commentary.filter((c) => !seen.has(c.id) && !deleted.has(c.id)),
    ];
  })();

  // Events stream in over the socket while the snapshot came from REST, so
  // dedupe by id and drop anything deleted while this page has been open.
  const timeline = (() => {
    const seen = new Set<string>();
    const deleted = new Set(live.deletedEventIds);
    const out: MatchEventDto[] = [];
    for (const e of [...(detail?.events ?? []), ...live.events]) {
      if (deleted.has(e.id) || seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
    }
    return out;
  })();

  if (error) return <p className="alert-error">{error}</p>;
  if (!detail) return <p className="text-slate-400">Loading match…</p>;

  // Mirrors the team card on MatchDetailPage: logo in a colour-ringed circle,
  // team name, and the score underneath. The score is hidden before kickoff,
  // when there is nothing meaningful to show.
  const Team = ({ side }: { side: "a" | "b" }) => {
    const t = side === "a" ? detail.teamA : detail.teamB;
    const score = side === "a"
      ? (status?.teamAScore ?? detail.teamAScore)
      : (status?.teamBScore ?? detail.teamBScore);
    const showScore = (status?.status ?? detail.status) !== "upcoming";
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
        {showScore && <span className="text-3xl font-black text-white drop-shadow">{score}</span>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Link to="/matches" className="text-sm text-brand-600 hover:underline">← Schedule</Link>
      <div className="card relative mt-3 overflow-hidden p-0">
        {/* Split-diagonal background, same geometry as MatchDetailPage: the
            line meets the top edge at 65% and the bottom edge at 25%. */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: detail.teamA.heroImage ? `url("${detail.teamA.heroImage}")` : undefined,
              backgroundColor: detail.teamA.color1,
              backgroundPosition: "left center",
              clipPath: "polygon(0 0, 65% 0, 25% 100%, 0 100%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: detail.teamB.heroImage ? `url("${detail.teamB.heroImage}")` : undefined,
              backgroundColor: detail.teamB.color1,
              backgroundPosition: "right center",
              clipPath: "polygon(65% 0, 100% 0, 100% 100%, 25% 100%)",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="relative px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            {isLive && <span aria-hidden="true" className="hidden w-28 shrink-0 sm:block" />}
            <p className="flex-1 text-center text-xs font-bold uppercase tracking-widest text-white drop-shadow">
              {status?.status ?? detail.status} · {new Date(detail.date).toLocaleString()}
            </p>
            {isLive && (
              <div className="flex w-24 shrink-0 justify-end sm:w-28">
                <span className="flex items-center gap-1 whitespace-nowrap rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  <span className={status?.isPaused ? "" : "animate-pulse"}>●</span>
                  {status?.isPaused ? "PAUSED" : "LIVE"} {live.connected ? "" : "· offline"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Team side="a" />
            <div className="flex shrink-0 flex-col items-center gap-1">
              {isLive ? (
                <span className="rounded bg-black/30 px-2 py-1 text-center text-sm font-bold text-white drop-shadow">
                  {status?.currentPeriod ? `${status.currentPeriod} period · ` : ""}{status?.currentMinute ?? 0}′
                </span>
              ) : (
                <span className="text-2xl font-black text-white drop-shadow">
                  {status?.status === "completed" ? "" : "vs"}
                </span>
              )}
            </div>
            <Team side="b" />
          </div>
        </div>

        {detail.venue && (
          <p className="relative flex items-center justify-center gap-1.5 border-t border-white/20 bg-black/30 px-4 py-3 text-sm text-white sm:px-6">
            <MapPin className="h-4 w-4 shrink-0 text-white/80" aria-hidden="true" />
            <span>{detail.venue.name}</span>
            <span>, {detail.venue.city}</span>
          </p>
        )}
        {status?.status === "completed" && detail.summary && (
          <p className="relative border-t border-white/20 bg-black/30 px-4 py-4 text-sm text-white sm:px-6">
            {detail.summary}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card min-w-0">
          <h2 className="mb-2 font-bold">Timeline</h2>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {timeline.map((e) => (
              <li key={e.id} className="flex gap-2 rounded bg-slate-50 px-2 py-1">
                <span className="shrink-0 font-bold">{e.period ? `${e.period} · ` : ""}{e.minute}'</span>
                <span className="shrink-0 capitalize">{e.eventType.replace("_", " ")}</span>
                <span className="min-w-0 flex-1 truncate text-slate-600">{[e.teamName, e.playerName, e.description].filter(Boolean).join(" — ")}</span>
              </li>
            ))}
            {timeline.length === 0 && (
              <li className="text-slate-400">{isLive ? "Events appear live…" : "No events recorded."}</li>
            )}
          </ul>
        </section>
        <section className="card min-w-0">
          <h2 className="mb-2 font-bold">Commentary</h2>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {merged.map((c) => (
              <li key={c.id} className="flex gap-2 rounded bg-slate-50 px-2 py-1">
                <span className="shrink-0 font-bold">{c.period ? `${c.period} · ` : ""}{c.minute}′</span>
                <span className="min-w-0 flex-1 break-words">{c.text}</span>
              </li>
            ))}
            {merged.length === 0 && <li className="text-slate-400">{isLive ? "Waiting for commentary…" : "No commentary."}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

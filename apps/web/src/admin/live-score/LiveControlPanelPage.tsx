import type { LiveStatusDto, MatchDto, MatchEventDto, CommentaryDto } from "@tournament/shared";
import { useEffect, useState } from "react";

import * as liveApi from "../../api/live.client.js";
import * as matchApi from "../../api/match.client.js";
import { apiErrorMessage } from "../../api/client.js";
import { useLiveMatch } from "../../sockets/useLiveMatch.js";

interface Toast { kind: "error" | "ok"; text: string }

/** Admin FE (Module 5): live control panel — start/pause/resume/end, score,
 *  events, commentary. Score_manager + super_admin (permission map). */
export function LiveControlPanelPage() {
  const [live, setLive] = useState<MatchDto[] | null>(null);
  const [upcoming, setUpcoming] = useState<MatchDto[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [toast, setToast] = useState<Toast | null>(null);

  const load = async () => {
    try {
      // single list fetch, split client-side — halves the polling load
      const all = await matchApi.listMatches({ page: 1, limit: 40 });
      setLive(all.items.filter((m) => m.status === "live"));
      setUpcoming(all.items.filter((m) => m.status === "upcoming" && new Date(m.date) <= new Date(Date.now() + 24 * 3600_000)));
      if (all.items.some((m) => m.status === "live") && !selected) setSelected(all.items.find((m) => m.status === "live")!.id);
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err) }); }
  };
  useEffect(() => { void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeMatch = [...(live ?? []), ...(upcoming ?? [])].find((m) => m.id === selected);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Live Control</h1>
      {toast && <p className={toast.kind === "error" ? "alert-error" : "alert-info"}>{toast.text}</p>}

      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Pick match">
          <option value="">Select match…</option>
          {(live ?? []).map((m) => <option key={m.id} value={m.id}>LIVE · {m.teamA.shortName} vs {m.teamB.shortName}</option>)}
          {(upcoming ?? []).map((m) => <option key={m.id} value={m.id}>{m.teamA.shortName} vs {m.teamB.shortName} — {m.date.slice(0, 16).replace("T", " ")}</option>)}
        </select>
        <button className="btn-secondary" onClick={() => void load()}>Refresh</button>
      </div>

      {activeMatch ? (
        <ControlPanel match={activeMatch} onChanged={() => void load()} onError={(t) => setToast({ kind: "error", text: t })} />
      ) : (
        <p className="text-sm text-slate-400">Pick a match to control, or schedule one in Match Center first.</p>
      )}
    </div>
  );
}

function ControlPanel({ match, onChanged, onError }: {
  match: MatchDto; onChanged: () => void; onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState("1st");
  const [minute, setMinute] = useState("0");
  const [summary, setSummary] = useState("");
  const [commentary, setCommentary] = useState("");
  const [ev, setEv] = useState({ eventType: "goal", teamId: "", playerId: "", description: "" });
  const [players, setPlayers] = useState<{ id: string; name: string; teamId: string; jerseyNumber: number }[]>([]);

  const feed = useLiveMatch(match.id, null);
  const status = feed.status;

  // REST snapshot on mount — current status + commentary + timeline (Section 9
  // reconnect path: never rely on socket replay alone).
  const [restFeed, setRestFeed] = useState<{ status: LiveStatusDto | null; commentary: CommentaryDto[] } | null>(null);
  const [timeline, setTimeline] = useState<MatchEventDto[]>([]);
  useEffect(() => {
    let ignore = false;
    void liveApi.getLiveFeed(match.id, { page: 1, limit: 50 })
      .then((f) => !ignore && setRestFeed({ status: f.status, commentary: f.commentary }))
      .catch(() => undefined);
    void matchApi.getMatch(match.id).then((d) => !ignore && setTimeline(d.events)).catch(() => undefined);
    playerApiLoad(match.id).then((p) => !ignore && setPlayers(p)).catch(() => undefined);
    return () => { ignore = true; };
  }, [match.id]);

  const liveStatus: LiveStatusDto | null = status ?? restFeed?.status ?? null;
  const isLive = liveStatus?.status === "live";
  const lines = feed.commentary.length ? feed.commentary : restFeed?.commentary ?? [];

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try { await fn(); onChanged(); }
    catch (err) { onError(apiErrorMessage(err, msg)); }
    finally { setBusy(false); }
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await matchApi.addEvent(match.id, {
        eventType: ev.eventType as MatchEventDto["eventType"],
        teamId: ev.teamId || null,
        playerId: ev.playerId || null,
        minute: Number(minute) || liveStatus?.currentMinute || 0,
        description: ev.description || null,
      });
      setEv({ ...ev, description: "", playerId: "" });
      const d = await matchApi.getMatch(match.id);
      setTimeline(d.events);
      onChanged();
    } catch (err) { onError(apiErrorMessage(err, "Add event failed")); }
    finally { setBusy(false); }
  }

  const bump = (side: "a" | "b", delta: number) => {
    const a = Math.max(0, (liveStatus?.teamAScore ?? match.teamAScore) + (side === "a" ? delta : 0));
    const b = Math.max(0, (liveStatus?.teamBScore ?? match.teamBScore) + (side === "b" ? delta : 0));
    void run(() => liveApi.updateScore(match.id, { teamAScore: a, teamBScore: b }), "Score update failed");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{match.teamA.name} vs {match.teamB.name}</h2>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${isLive ? "bg-red-600 text-white" : "bg-slate-100"}`}>
            {liveStatus?.status ?? match.status}{liveStatus?.isPaused ? " (paused)" : ""}
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <span className="text-4xl font-black">{liveStatus?.teamAScore ?? match.teamAScore}</span>
          <span className="text-slate-300">–</span>
          <span className="text-4xl font-black">{liveStatus?.teamBScore ?? match.teamBScore}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-secondary !px-3 !py-1 text-xs" disabled={busy || !isLive || liveStatus?.isPaused} onClick={() => void run(() => liveApi.pauseMatch(match.id), "Pause failed")}>⏸ Pause</button>
          <button className="btn-secondary !px-3 !py-1 text-xs" disabled={busy || !isLive || !liveStatus?.isPaused} onClick={() => void run(() => liveApi.resumeMatch(match.id), "Resume failed")}>▶ Resume</button>
          {match.status === "upcoming" && (
            <button className="btn-primary !px-3 !py-1 text-xs" disabled={busy}
              onClick={() => void run(() => liveApi.startMatch(match.id, { period, minute: Number(minute) || 0 }), "Start failed")}>
              ● Start match
            </button>
          )}
          {isLive && (
            <button className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50" disabled={busy}
              onClick={() => { if (window.confirm("End this match? It becomes completed and standings update.")) void run(() => liveApi.endMatch(match.id, { summary: summary || null }), "End failed"); }}>
              ■ End match
            </button>
          )}
        </div>

        {match.status === "upcoming" && (
          <div className="flex gap-2">
            <input className="input w-24" placeholder="period" value={period} onChange={(e) => setPeriod(e.target.value)} />
            <input type="number" className="input w-24" placeholder="minute" value={minute} onChange={(e) => setMinute(e.target.value)} />
          </div>
        )}

        {isLive && (
          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            {(["a", "b"] as const).map((side) => (
              <div key={side}>
                <p className="mb-1 text-xs font-bold">{side === "a" ? match.teamA.name : match.teamB.name}</p>
                <div className="flex gap-2">
                  <button className="btn-secondary !px-3 !py-1 text-xs" disabled={busy} onClick={() => bump(side, 1)}>+1 goal</button>
                  <button className="btn-secondary !px-3 !py-1 text-xs" disabled={busy} onClick={() => bump(side, -1)}>−1</button>
                </div>
                <input type="number" className="input mt-2 w-24" placeholder="clock′" value={minute} onChange={(e) => setMinute(e.target.value)} />
              </div>
            ))}
            <label className="col-span-2 flex items-center gap-2 text-sm">
              Period
              <input className="input w-28" value={period} onChange={(e) => setPeriod(e.target.value)} />
              <button className="btn-secondary !px-3 !py-1 text-xs" disabled={busy}
                onClick={() => void run(() => liveApi.updateScore(match.id, {
                  teamAScore: liveStatus?.teamAScore ?? 0,
                  teamBScore: liveStatus?.teamBScore ?? 0,
                  minute: Number(minute) || 0,
                  period,
                }), "Clock update failed")}>Set clock</button>
            </label>
            <input className="col-span-2 input" placeholder="final summary (optional, on end)" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">Timeline &amp; commentary {isLive && feed.connected && <span className="text-xs font-normal text-green-600">● live</span>}</h2>
        {!isLive && match.status !== "upcoming" ? (
          <p className="text-sm text-slate-400">Not live — events read-only:</p>
        ) : (
          <form onSubmit={addEvent} className="flex flex-wrap gap-2">
            <select className="input w-auto" value={ev.eventType} onChange={(e) => setEv({ ...ev, eventType: e.target.value })}>
              {["goal", "penalty", "card", "substitution", "period_start", "period_end", "other"].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select className="input w-auto" value={ev.teamId} onChange={(e) => setEv({ ...ev, teamId: e.target.value, playerId: "" })}>
              <option value="">team…</option>
              <option value={match.teamAId}>{match.teamA.shortName}</option>
              <option value={match.teamBId}>{match.teamB.shortName}</option>
            </select>
            <select className="input w-auto" value={ev.playerId} onChange={(e) => setEv({ ...ev, playerId: e.target.value })} disabled={!ev.teamId}>
              <option value="">player…</option>
              {players.filter((p) => p.teamId === ev.teamId).map((p) => <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.name}</option>)}
            </select>
            <input className="input w-48 flex-1" placeholder="description" value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
            <button className="btn-primary !px-3 text-xs" disabled={busy}>Add event</button>
          </form>
        )}
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {[...timeline].map((e) => (
            <li key={e.id} className="flex gap-2 rounded bg-slate-50 px-2 py-1">
              <span className="font-bold">{e.minute}′</span>
              <span className="capitalize">{e.eventType.replace("_", " ")}</span>
              <span className="flex-1 truncate text-slate-600">{[e.teamName, e.playerName, e.description].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
          {timeline.length === 0 && <li className="text-slate-400">No events yet.</li>}
        </ul>

        {isLive && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            await run(async () => {
              await liveApi.publishCommentary(match.id, { minute: Number(minute) || 0, text: commentary, type: "info" });
              setCommentary("");
            }, "Commentary failed");
          }} className="flex gap-2 border-t pt-3">
            <input className="input flex-1" required maxLength={500} placeholder={`Commentary @ ${minute}′…`} value={commentary} onChange={(e) => setCommentary(e.target.value)} />
            <button className="btn-primary !px-3 text-xs" disabled={busy}>Publish</button>
          </form>
        )}
        <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
          {lines.map((c) => (
            <li key={c.id} className="flex gap-2 rounded bg-slate-50 px-2 py-1">
              <span className="font-bold">{c.minute}′</span>
              <span className="flex-1">{c.text}</span>
            </li>
          ))}
          {lines.length === 0 && <li className="text-slate-400">No commentary yet.</li>}
        </ul>
      </section>
    </div>
  );
}

async function playerApiLoad(matchId: string) {
  const d = await matchApi.getMatch(matchId);
  const { listPlayers } = await import("../../api/player.client.js");
  const all = await listPlayers({ page: 1, limit: 100, tournamentId: d.tournamentId });
  return all.items
    .filter((p) => p.teamId === d.teamAId || p.teamId === d.teamBId)
    .map((p) => ({ id: p.id, name: p.name, teamId: p.teamId, jerseyNumber: p.jerseyNumber }));
}

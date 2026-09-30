import type { MatchDto, MatchEventTypeName, MatchStatusName, PlayerDto, TeamDto, TournamentDto, VenueDto } from "@tournament/shared";
import { MATCH_EVENT_TYPES, MATCH_STATUSES } from "@tournament/shared";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import * as matchApi from "../../api/match.client.js";
import * as teamApi from "../../api/team.client.js";
import * as tournamentApi from "../../api/tournament.client.js";
import * as venueApi from "../../api/tournament.client.js";
import * as playerApi from "../../api/player.client.js";
import { apiErrorMessage } from "../../api/client.js";

interface Toast { kind: "error" | "ok"; text: string }

const pad2 = (n: number) => String(n).padStart(2, "0");

/** UTC ISO -> datetime-local value (keeps wall-clock time stable across edit/save). */
function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** UTC ISO -> local YYYY-MM-DD, matching how the time is displayed. */
function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Admin FE (Module 4): schedule by date + create/edit + results + timeline. */
export function MatchAdminPage() {
  const [matches, setMatches] = useState<MatchDto[] | null>(null);
  const [tournaments, setTournaments] = useState<TournamentDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MatchDto | null>(null);
  const [managing, setManaging] = useState<string | null>(null);
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const [m, tr] = await Promise.all([
        matchApi.listMatches({ page: 1, limit: 100 }),
        tournamentApi.listTournaments({ page: 1, limit: 50 }),
      ]);
      setMatches(m.items);
      setTournaments(tr.items);
      const [tm, vn] = await Promise.all([
        teamApi.listTeams({ page: 1, limit: 100 }),
        venueApi.listVenues({ page: 1, limit: 50 }),
      ]);
      setTeams(tm.items);
      setVenues(vn.items);
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err) }); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => {
    if (!matches) return matches;
    return matches.filter((m) => {
      if (tournamentFilter && m.tournamentId !== tournamentFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [matches, tournamentFilter, statusFilter]);

  // Group the schedule by date for the calendar view
  const byDate = useMemo(() => {
    const groups = new Map<string, MatchDto[]>();
    for (const m of shown ?? []) {
      const key = localDateKey(m.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shown]);

  async function remove(m: MatchDto) {
    if (!window.confirm(`Delete ${m.teamA.shortName} vs ${m.teamB.shortName} (${m.date.slice(0, 10)})?`)) return;
    try { await matchApi.deleteMatch(m.id); await load(); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Delete failed") }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Match Center</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>Schedule match</button>
      </div>
      {toast && <p className={toast.kind === "error" ? "alert-error" : "alert-info"}>{toast.text}</p>}

      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={tournamentFilter} onChange={(e) => setTournamentFilter(e.target.value)} aria-label="Filter by tournament">
          <option value="">All tournaments</option>
          {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} {t.season}</option>)}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {MATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {(creating || editing) && (
        <MatchForm
          initial={editing}
          teams={teams.filter((t) => !editing || t.tournamentId === editing.tournamentId)}
          allTeams={teams}
          tournaments={tournaments}
          venues={venues}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={async (msg) => { setCreating(false); setEditing(null); setToast({ kind: "ok", text: msg }); await load(); }}
        />
      )}

      {!matches ? <p className="text-slate-400">Loading schedule…</p> : byDate.length === 0 ? (
        <p className="text-sm text-slate-400">No matches scheduled.</p>
      ) : (
        byDate.map(([date, dayMatches]) => (
          <section key={date} className="card">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">
              {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h2>
            <div className="divide-y divide-slate-100">
              {dayMatches.map((m) => (
                <div key={m.id}>
                  <div className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-14 text-sm font-semibold text-slate-500">{new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="flex-1 min-w-[220px] text-sm">
                      <b>{m.teamA.name}</b> <span className="text-slate-400">vs</span> <b>{m.teamB.name}</b>
                      {m.venue && <span className="text-xs text-slate-400"> · {m.venue.name}, {m.venue.city}</span>}
                    </span>
                    {m.status === "completed" ? (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">{m.teamAScore} – {m.teamBScore}</span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{m.status}</span>
                    )}
                    <div className="flex gap-2">
                      <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setManaging(managing === m.id ? null : m.id)}>
                        {managing === m.id ? "Close" : "Manage"}
                      </button>
                      {m.status !== "live" && <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setEditing(m)}>Edit</button>}
                      <button className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => void remove(m)}>Delete</button>
                    </div>
                  </div>
                      {managing === m.id && (
                        <MatchManager matchId={m.id} onDone={load} onError={(t) => setToast({ kind: "error", text: t })} />
                      )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function MatchForm({ initial, teams, allTeams, tournaments, venues, onClose, onSaved }: {
  initial: MatchDto | null;
  teams: TeamDto[];
  allTeams: TeamDto[];
  tournaments: TournamentDto[];
  venues: VenueDto[];
  onClose: () => void;
  onSaved: (msg: string) => Promise<void>;
}) {
  const teamCount = (tournamentId: string) => teams.filter((t) => t.tournamentId === tournamentId).length;
  const defaultTournamentId =
    tournaments.find((t) => t.isActive && teamCount(t.id) >= 2)?.id ??
    [...tournaments].sort((a, b) => teamCount(b.id) - teamCount(a.id))[0]?.id ??
    "";

  const [form, setForm] = useState({
    tournamentId: initial?.tournamentId ?? defaultTournamentId,
    teamAId: initial?.teamAId ?? "",
    teamBId: initial?.teamBId ?? "",
    venueId: initial?.venueId ?? "",
    date: initial ? toDateTimeLocal(initial.date) : "",
    status: (initial?.status ?? "upcoming") as MatchStatusName,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eligible = allTeams.filter((t) => t.tournamentId === form.tournamentId);

  // Completed matches can't change status (server rejects regression too) —
  // lock the select to its current value so editing score/venue/date works.
  const isCompleted = initial?.status === "completed";
  const statusLocked = Boolean(isCompleted);
  const statusOptions: MatchStatusName[] = isCompleted ? ["completed"] : ["upcoming", "cancelled"];

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const body = {
      tournamentId: form.tournamentId,
      teamAId: form.teamAId, teamBId: form.teamBId,
      venueId: form.venueId || null,
      date: new Date(form.date).toISOString(),
      status: form.status,
    };
    try {
      if (initial) { await matchApi.updateMatch(initial.id, body); await onSaved("Match updated"); }
      else { await matchApi.createMatch(body); await onSaved("Match scheduled"); }
    } catch (err) { setError(apiErrorMessage(err, "Save failed")); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-bold">{initial ? "Edit match" : "Schedule match"}</h2>
      {error && <p className="alert-error">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Tournament</label>
          <select className="input" required value={form.tournamentId}
            onChange={(e) => setForm({ ...form, tournamentId: e.target.value, teamAId: "", teamBId: "" })}>
            <option value="">Select…</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} {t.season}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date &amp; time</label>
          <input type="datetime-local" className="input" required value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Team A</label>
          <select className="input" required value={form.teamAId} onChange={(e) => setForm({ ...form, teamAId: e.target.value })}>
            <option value="">Select…</option>
            {eligible.map((t) => <option key={t.id} value={t.id} disabled={t.id === form.teamBId}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Team B</label>
          <select className="input" required value={form.teamBId} onChange={(e) => setForm({ ...form, teamBId: e.target.value })}>
            <option value="">Select…</option>
            {eligible.map((t) => <option key={t.id} value={t.id} disabled={t.id === form.teamAId}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Venue</label>
          <select className="input" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
            <option value="">— none —</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}, {v.city}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            disabled={statusLocked}
            onChange={(e) => setForm({ ...form, status: e.target.value as MatchStatusName })}
          >
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {statusLocked ? (
            <p className="mt-1 text-xs text-slate-400">Completed — status is fixed (use Manage to correct the score).</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">live/completed are set via Manage (results) and Module 5.</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy || !form.teamAId || !form.teamBId}>{busy ? "Saving…" : initial ? "Save changes" : "Schedule"}</button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
      {form.tournamentId && eligible.length < 2 && (
        <p className="text-xs text-amber-600">
          {eligible.length === 0
            ? "No teams in this tournament yet — register teams first."
            : "This tournament has only 1 team — a match needs at least 2 teams. Register another team, or pick a different tournament above."}
        </p>
      )}
    </form>
  );
}

/** Result entry + match timeline editor (goal/penalty/card/sub per team/player/minute). */
function MatchManager({ matchId, onDone, onError }: {
  matchId: string; onDone: () => Promise<void>; onError: (msg: string) => void;
}) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof matchApi.getMatch>> | null>(null);
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [summary, setSummary] = useState("");
  const [ev, setEv] = useState({ eventType: "goal" as MatchEventTypeName, teamId: "", playerId: "", minute: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const d = await matchApi.getMatch(matchId);
    setDetail(d);
    setScoreA(String(d.teamAScore)); setScoreB(String(d.teamBScore)); setSummary(d.summary ?? "");
    return d;
  }, [matchId]);

  useEffect(() => {
    void load().then(async (d) => {
      const list = await playerApi.listPlayers({ page: 1, limit: 100 });
      setPlayers(list.items.filter((p) => p.teamId === d.teamAId || p.teamId === d.teamBId));
    }).catch((err) => onError(apiErrorMessage(err)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function saveResult(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await matchApi.updateResult(matchId, { teamAScore: Number(scoreA), teamBScore: Number(scoreB), summary: summary || null }); await load(); await onDone(); }
    catch (err) { onError(apiErrorMessage(err, "Result save failed")); }
    finally { setBusy(false); }
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await matchApi.addEvent(matchId, {
        eventType: ev.eventType,
        teamId: ev.teamId || null,
        playerId: ev.playerId || null,
        minute: Number(ev.minute),
        description: ev.description || null,
      });
      setEv({ ...ev, minute: "", description: "", playerId: "" });
      await load(); await onDone();
    } catch (err) { onError(apiErrorMessage(err, "Add event failed")); }
    finally { setBusy(false); }
  }

  async function removeEvent(id: string) {
    try { await matchApi.deleteEvent(id); await load(); await onDone(); }
    catch (err) { onError(apiErrorMessage(err, "Delete failed")); }
  }

  if (!detail) return <div className="bg-slate-50 p-4 text-sm text-slate-400">Loading…</div>;
  const isLive = detail.status === "live";
  const teamPlayers = (teamId: string) => players.filter((p) => p.teamId === teamId);

  return (
    <div className="space-y-4 bg-slate-50 p-4">
      {isLive ? (
        <p className="text-sm text-amber-700">This match is live — scores and events are controlled from the live panel (Module 5).</p>
      ) : (
        <form onSubmit={saveResult} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label">{detail.teamA.shortName}</label>
            <input type="number" min={0} max={100} className="input w-20" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
          </div>
          <span className="pb-2 font-bold">–</span>
          <div>
            <label className="label">{detail.teamB.shortName}</label>
            <input type="number" min={0} max={100} className="input w-20" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="label">Summary</label>
            <input className="input" maxLength={2000} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy}>Save result</button>
          {detail.status === "upcoming" && <span className="pb-2 text-xs text-slate-500">saving marks it completed</span>}
        </form>
      )}

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Timeline ({detail.events.length})</h3>
        {!isLive && (
          <form onSubmit={addEvent} className="mb-3 flex flex-wrap items-end gap-2">
            <select className="input w-auto" value={ev.eventType} onChange={(e) => setEv({ ...ev, eventType: e.target.value as MatchEventTypeName })}>
              {MATCH_EVENT_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select className="input w-auto" value={ev.teamId} onChange={(e) => setEv({ ...ev, teamId: e.target.value, playerId: "" })}>
              <option value="">team…</option>
              <option value={detail.teamAId}>{detail.teamA.name}</option>
              <option value={detail.teamBId}>{detail.teamB.name}</option>
            </select>
            <select className="input w-auto" value={ev.playerId} onChange={(e) => setEv({ ...ev, playerId: e.target.value })} disabled={!ev.teamId}>
              <option value="">player…</option>
              {teamPlayers(ev.teamId).map((p) => <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.name}</option>)}
            </select>
            <input type="number" min={0} max={200} required className="input w-20" placeholder="min" value={ev.minute} onChange={(e) => setEv({ ...ev, minute: e.target.value })} />
            <input className="input w-56 flex-1" placeholder="description (optional)" maxLength={500} value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
            <button className="btn-primary" disabled={busy}>Add</button>
          </form>
        )}
        <ul className="space-y-1">
          {detail.events.map((e) => (
            <li key={e.id} className="flex items-center gap-2 rounded bg-white px-3 py-2 text-sm">
              <span className="w-10 font-bold">{e.minute}'</span>
              <span className="w-24 capitalize">{e.eventType.replace("_", " ")}</span>
              <span className="flex-1 text-slate-600">
                {[e.teamName, e.playerName && `— ${e.playerName}`, e.description].filter(Boolean).join(" ")}
              </span>
              {!isLive && <button className="text-xs text-red-600 hover:underline" onClick={() => void removeEvent(e.id)}>remove</button>}
            </li>
          ))}
          {detail.events.length === 0 && <li className="text-sm text-slate-400">No events yet.</li>}
        </ul>
      </div>
    </div>
  );
}

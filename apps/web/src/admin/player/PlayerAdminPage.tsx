import type { PlayerDto, PlayerPositionName, TeamDto } from "@tournament/shared";
import { PLAYER_POSITIONS } from "@tournament/shared";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import * as playerApi from "../../api/player.client.js";
import * as teamApi from "../../api/team.client.js";
import { apiErrorMessage } from "../../api/client.js";
import { useAuthStore } from "../../store/auth.store.js";

interface Toast { kind: "error" | "ok"; text: string }

const emptyForm = {
  name: "", image: "", jerseyNumber: "", position: "forward" as PlayerPositionName,
  dateOfBirth: "", nationality: "", teamId: "",
};

/** Admin FE (Module 3): registration form + searchable/filterable directory. */
export function PlayerAdminPage() {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "team_owner";
  const [players, setPlayers] = useState<PlayerDto[] | null>(null);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [filterTeam, setFilterTeam] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const [pl, tm] = await Promise.all([
        playerApi.listPlayers({ page: 1, limit: 100 }),
        teamApi.listTeams({ page: 1, limit: 100 }),
      ]);
      setPlayers(pl.items);
      setTeams(tm.items);
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err) }); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // team_owner only manages their own teams
  const myTeams = useMemo(
    () => (isOwner ? teams.filter((t) => t.ownerId === user?.id) : teams),
    [teams, isOwner, user]
  );

  const shown = useMemo(() => {
    if (!players) return players;
    return players.filter((p) => {
      if (isOwner) return myTeams.some((t) => t.id === p.teamId);
      if (filterTeam && p.teamId !== filterTeam) return false;
      if (filterPos && p.position !== filterPos) return false;
      if (search && !`${p.name} ${p.nationality} #${p.jerseyNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [players, isOwner, myTeams, filterTeam, filterPos, search]);

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id.slice(0, 8);

  function toInput(f: typeof emptyForm) {
    return {
      name: f.name, image: f.image || null, jerseyNumber: Number(f.jerseyNumber),
      position: f.position, dateOfBirth: f.dateOfBirth, nationality: f.nationality,
      teamId: f.teamId,
    };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.teamId) { setToast({ kind: "error", text: "Pick a team first" }); return; }
    setBusy(true); setToast(null);
    try {
      if (editingId) { await playerApi.updatePlayer(editingId, toInput(form)); setToast({ kind: "ok", text: "Player updated" }); }
      else { await playerApi.createPlayer(toInput(form)); setToast({ kind: "ok", text: "Player registered" }); }
      setEditingId(null); setForm(emptyForm); await load();
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Save failed") }); }
    finally { setBusy(false); }
  }

  function fill(p: PlayerDto) {
    setEditingId(p.id);
    setForm({
      name: p.name, image: p.image ?? "", jerseyNumber: String(p.jerseyNumber),
      position: p.position, dateOfBirth: p.dateOfBirth.slice(0, 10), nationality: p.nationality,
      teamId: p.teamId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(p: PlayerDto) {
    if (!window.confirm(`Delete player "${p.name}"?`)) return;
    try { await playerApi.deletePlayer(p.id); await load(); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Delete failed") }); }
  }

  async function reassign(p: PlayerDto, targetTeamId: string) {
    if (!targetTeamId) return;
    try { const r = await playerApi.reassignPlayer(p.id, targetTeamId); await load(); setToast({ kind: "ok", text: `${r.name} moved to ${teamName(targetTeamId)}` }); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Reassign failed") }); await load(); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Players</h1>
      {isOwner && <p className="text-sm text-slate-500">You can manage players on your team{myTeams.length > 1 ? "s" : ""} only.</p>}
      {toast && <p className={toast.kind === "error" ? "alert-error" : "alert-info"}>{toast.text}</p>}

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold">{editingId ? "Edit player" : "Register player"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Team</label>
            <select className="input" required value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              <option value="">Select…</option>
              {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">Name</label><input className="input" required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Jersey number</label><input type="number" required min={1} max={99} className="input" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} /></div>
          <div><label className="label">Position</label>
            <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as PlayerPositionName })}>
              {PLAYER_POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
            </select></div>
          <div><label className="label">Date of birth</label><input type="date" required max={new Date().toISOString().slice(0, 10)} min="1900-01-02" className="input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div><label className="label">Nationality</label><input className="input" required minLength={2} maxLength={60} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Photo URL</label><input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Register"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>

      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {!isOwner && (
            <>
              <select className="input w-auto" value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} aria-label="Filter by team">
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select className="input w-auto" value={filterPos} onChange={(e) => setFilterPos(e.target.value)} aria-label="Filter by position">
                <option value="">All positions</option>
                {PLAYER_POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </>
          )}
          <input className="input w-56" placeholder="Search name / nationality / #…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left">
              <th className="px-4 py-3">#</th><th className="px-4 py-3">Player</th><th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Team</th><th className="px-4 py-3">DOB</th><th className="px-4 py-3">Nationality</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {shown?.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-bold" style={{ color: teams.find((t) => t.id === p.teamId)?.color1 }}>#{p.jerseyNumber}</td>
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {p.image && <img src={p.image} alt="" className="h-7 w-7 rounded-full object-cover" />}
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{p.position}</span></td>
                  <td className="px-4 py-3">
                    <select className="input w-auto !py-1 text-xs" value={p.teamId} onChange={(e) => void reassign(p, e.target.value)} aria-label="Reassign team">
                      {(isOwner ? myTeams : teams).map((t) => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.dateOfBirth.slice(0, 10)}</td>
                  <td className="px-4 py-3">{p.nationality}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="btn-secondary mr-2 !px-3 !py-1 text-xs" onClick={() => fill(p)}>Edit</button>
                    <button className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => void remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown && shown.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No players found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

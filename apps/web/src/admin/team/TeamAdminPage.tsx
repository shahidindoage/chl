import type { CreateTeamInput, SponsorDto, TeamDto, TournamentDto } from "@tournament/shared";
import { FormEvent, useCallback, useEffect, useState } from "react";

import * as teamApi from "../../api/team.client.js";
import * as tournamentApi from "../../api/tournament.client.js";
import { apiErrorMessage } from "../../api/client.js";
import { useAuthStore } from "../../store/auth.store.js";

interface Toast { kind: "error" | "ok"; text: string }

const emptyForm = {
  name: "", shortName: "", logo: "", color1: "#0a6cc2", color2: "",
  tournamentId: "", coachName: "", coachImage: "",
};

/** Admin FE (Module 2): team list + create/edit form + sponsor add/remove. */
export function TeamAdminPage() {
  const user = useAuthStore((s) => s.user);
  const [teams, setTeams] = useState<TeamDto[] | null>(null);
  const [tournaments, setTournaments] = useState<TournamentDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sponsorsFor, setSponsorsFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, tr] = await Promise.all([
        teamApi.listTeams({ page: 1, limit: 100 }),
        tournamentApi.listTournaments({ page: 1, limit: 100 }),
      ]);
      setTeams(t.items);
      setTournaments(tr.items);
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err) }); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function toInput(f: typeof emptyForm): CreateTeamInput {
    return {
      name: f.name, shortName: f.shortName, logo: f.logo || null,
      color1: f.color1, color2: f.color2 || null, tournamentId: f.tournamentId,
      coachName: f.coachName || null, coachImage: f.coachImage || null,
      ownerId: null, // team_owner gets themselves assigned server-side
    };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.tournamentId) { setToast({ kind: "error", text: "Pick a tournament first" }); return; }
    setBusy(true); setToast(null);
    try {
      if (editingId) { await teamApi.updateTeam(editingId, toInput(form)); setToast({ kind: "ok", text: "Team updated" }); }
      else { await teamApi.createTeam(toInput(form)); setToast({ kind: "ok", text: "Team created" }); }
      setEditingId(null); setForm(emptyForm); await load();
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Save failed") }); }
    finally { setBusy(false); }
  }

  function fill(t: TeamDto) {
    setEditingId(t.id);
    setForm({
      name: t.name, shortName: t.shortName, logo: t.logo ?? "", color1: t.color1,
      color2: t.color2 ?? "", tournamentId: t.tournamentId,
      coachName: t.coachName ?? "", coachImage: t.coachImage ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(t: TeamDto) {
    if (!window.confirm(`Delete team "${t.name}"? Sponsors go with it.`)) return;
    try { await teamApi.deleteTeam(t.id); if (sponsorsFor === t.id) setSponsorsFor(null); await load(); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Delete failed") }); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teams</h1>
      {toast && <p className={toast.kind === "error" ? "alert-error" : "alert-info"}>{toast.text}</p>}

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold">{editingId ? "Edit team" : "New team"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Tournament</label>
            <select className="input" required value={form.tournamentId} onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}>
              <option value="">Select…</option>
              {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} {t.season}</option>)}
            </select>
          </div>
          <div><label className="label">Name</label><input className="input" required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Short name</label><input className="input" required minLength={2} maxLength={8} pattern="[A-Za-z0-9]+" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })} /></div>
          <div><label className="label">Logo URL</label><input className="input" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></div>
          <div className="flex items-end gap-3">
            <div><label className="label">Color 1</label><input type="color" className="h-10 w-16 rounded border" value={form.color1} onChange={(e) => setForm({ ...form, color1: e.target.value })} /></div>
            <div><label className="label">Color 2</label><input type="color" className="h-10 w-16 rounded border" value={form.color2 || "#ffffff"} onChange={(e) => setForm({ ...form, color2: e.target.value })} /></div>
          </div>
          <div><label className="label">Coach name</label><input className="input" maxLength={120} value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} /></div>
          <div><label className="label">Coach photo URL</label><input className="input" value={form.coachImage} onChange={(e) => setForm({ ...form, coachImage: e.target.value })} /></div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create team"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50 text-left">
            <th className="px-4 py-3">Team</th><th className="px-4 py-3">Colors</th><th className="px-4 py-3">Coach</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {teams?.map((t) => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {t.logo ? <img src={t.logo} alt="" className="h-6 w-6 rounded object-contain" /> :
                      <span className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: t.color1 }}>{t.shortName}</span>}
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-slate-400">{t.shortName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex gap-1">
                    <span className="h-4 w-4 rounded-full border" style={{ background: t.color1 }} />
                    {t.color2 && <span className="h-4 w-4 rounded-full border" style={{ background: t.color2 }} />}
                  </span>
                </td>
                <td className="px-4 py-3">{t.coachName ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{t.ownerId ? (t.ownerId === user?.id ? "you" : t.ownerId.slice(0, 8)) : "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button className="btn-secondary mr-2 !px-3 !py-1 text-xs" onClick={() => setSponsorsFor(sponsorsFor === t.id ? null : t.id)}>Sponsors</button>
                  <button className="btn-secondary mr-2 !px-3 !py-1 text-xs" onClick={() => fill(t)}>Edit</button>
                  <button className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => void remove(t)}>Delete</button>
                </td>
              </tr>
            ))}
            {teams && teams.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No teams yet</td></tr>}
          </tbody>
        </table>
      </div>

      {sponsorsFor && <SponsorEditor teamId={sponsorsFor} onSaved={() => void load()} />}
    </div>
  );
}

function SponsorEditor({ teamId, onSaved }: { teamId: string; onSaved: () => void }) {
  const [sponsors, setSponsors] = useState<SponsorDto[]>([]);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const team = await teamApi.getTeam(teamId);
    setSponsors(team.sponsors);
  }, [teamId]);
  useEffect(() => { void load().catch((err) => setError(apiErrorMessage(err))); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { await teamApi.addSponsor(teamId, { name, logo: logo || null }); setName(""); setLogo(""); await load(); onSaved(); }
    catch (err) { setError(apiErrorMessage(err, "Add failed")); }
    finally { setBusy(false); }
  }

  async function remove(id: string, sponsorName: string) {
    if (!window.confirm(`Remove sponsor "${sponsorName}"?`)) return;
    try { await teamApi.deleteSponsor(id); await load(); }
    catch (err) { setError(apiErrorMessage(err, "Remove failed")); }
  }

  return (
    <section className="card space-y-3">
      <h3 className="font-bold">Sponsors</h3>
      {error && <p className="alert-error">{error}</p>}
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input className="input w-44" required minLength={2} placeholder="Sponsor name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input w-56" placeholder="Logo URL (optional)" value={logo} onChange={(e) => setLogo(e.target.value)} />
        <button className="btn-primary" disabled={busy}>Add</button>
      </form>
      <ul className="divide-y divide-slate-100">
        {sponsors.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2 text-sm">
            <span className="flex items-center gap-2">
              {s.logo && <img src={s.logo} alt="" className="h-5 w-5 object-contain" />}
              {s.name}
            </span>
            <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => void remove(s.id, s.name)}>Remove</button>
          </li>
        ))}
        {sponsors.length === 0 && <li className="py-2 text-sm text-slate-400">No sponsors yet.</li>}
      </ul>
    </section>
  );
}

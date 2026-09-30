import type { TournamentDto, TournamentFormatName, TournamentStatusName, VenueDto } from "@tournament/shared";
import { TOURNAMENT_FORMATS, TOURNAMENT_STATUSES } from "@tournament/shared";
import { FormEvent, useCallback, useEffect, useState } from "react";

import * as api from "../../api/tournament.client.js";
import { apiErrorMessage } from "../../api/client.js";

interface Toast { kind: "error" | "ok"; text: string }

const emptyForm = {
  name: "", season: "", format: "league" as TournamentFormatName,
  rules: "", startDate: "", endDate: "", status: "draft" as TournamentStatusName,
  logo: "", isActive: false,
};

function toInput(f: typeof emptyForm) {
  return {
    name: f.name, season: f.season, format: f.format,
    rules: f.rules || null,
    startDate: new Date(f.startDate).toISOString(),
    endDate: new Date(f.endDate).toISOString(),
    status: f.status, logo: f.logo || null, isActive: f.isActive,
  };
}

/** Admin FE (Module 1): create/edit/list tournaments + venue manager. */
export function TournamentAdminPage() {
  const [data, setData] = useState<api.Paginated<TournamentDto> | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async (page = 1) => {
    try { setData(await api.listTournaments({ page, limit: 20 })); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err) }); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function fill(t: TournamentDto) {
    setEditingId(t.id);
    setForm({
      name: t.name, season: t.season, format: t.format, rules: t.rules ?? "",
      startDate: t.startDate.slice(0, 10), endDate: t.endDate.slice(0, 10),
      status: t.status, logo: t.logo ?? "", isActive: t.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setToast(null);
    try {
      if (editingId) {
        await api.updateTournament(editingId, toInput(form));
        setToast({ kind: "ok", text: "Tournament updated" });
      } else {
        await api.createTournament(toInput(form));
        setToast({ kind: "ok", text: "Tournament created" });
      }
      setEditingId(null); setForm(emptyForm); await load();
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Save failed") }); }
    finally { setBusy(false); }
  }

  async function remove(t: TournamentDto) {
    if (!window.confirm(`Delete "${t.name} ${t.season}"?`)) return;
    try { await api.deleteTournament(t.id); await load(); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Delete failed") }); }
  }

  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tournaments</h1>
      {toast && <p className={toast.kind === "error" ? "alert-error" : "alert-info"}>{toast.text}</p>}

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold">{editingId ? `Edit tournament` : "New tournament"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Name</label><input className="input" required minLength={2} maxLength={120} value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
          <div><label className="label">Season</label><input className="input" required minLength={2} maxLength={24} pattern="[\w .\/-]+" title="Letters, numbers, spaces, / . - only" placeholder="2026" value={form.season} onChange={(e) => set({ season: e.target.value })} /></div>
          <div><label className="label">Start date</label><input type="date" className="input" required value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} /></div>
          <div><label className="label">End date</label><input type="date" className="input" required value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} /></div>
          <div><label className="label">Format</label>
            <select className="input" value={form.format} onChange={(e) => set({ format: e.target.value as TournamentFormatName })}>
              {TOURNAMENT_FORMATS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set({ status: e.target.value as TournamentStatusName })}>
              {TOURNAMENT_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select></div>
        </div>
        <div><label className="label">Logo URL (optional)</label><input className="input" value={form.logo} onChange={(e) => set({ logo: e.target.value })} /></div>
        <div><label className="label">Rules / format description</label>
          <textarea className="input min-h-[90px]" value={form.rules} onChange={(e) => set({ rules: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="h-4 w-4" />
          Active tournament (only one can be active — activates on save)
        </label>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50 text-left">
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Season</th><th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Format</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Active</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {data?.items.map((t) => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{t.season}</td>
                <td className="px-4 py-3 text-slate-500">{t.startDate.slice(0, 10)} → {t.endDate.slice(0, 10)}</td>
                <td className="px-4 py-3">{t.format}</td>
                <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{t.status}</span></td>
                <td className="px-4 py-3">{t.isActive ? "●" : "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button className="btn-secondary mr-2 !px-3 !py-1 text-xs" onClick={() => fill(t)}>Edit</button>
                  <button className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => void remove(t)}>Delete</button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No tournaments yet</td></tr>}
          </tbody>
        </table>
      </div>
      <VenueManager />
    </div>
  );
}

function VenueManager() {
  const [venues, setVenues] = useState<api.Paginated<VenueDto> | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", capacity: "", image: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async () => {
    try { setVenues(await api.listVenues({ page: 1, limit: 50 })); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err) }); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setToast(null);
    const input = {
      name: form.name, address: form.address, city: form.city,
      capacity: form.capacity ? Number(form.capacity) : null, image: form.image || null,
    };
    try {
      if (editingId) { await api.updateVenue(editingId, input); setToast({ kind: "ok", text: "Venue updated" }); }
      else { await api.createVenue(input); setToast({ kind: "ok", text: "Venue created" }); }
      setEditingId(null); setForm({ name: "", address: "", city: "", capacity: "", image: "" }); await load();
    } catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Save failed") }); }
    finally { setBusy(false); }
  }

  async function remove(v: VenueDto) {
    if (!window.confirm(`Delete venue "${v.name}"?`)) return;
    try { await api.deleteVenue(v.id); await load(); }
    catch (err) { setToast({ kind: "error", text: apiErrorMessage(err, "Delete failed") }); }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Venue manager</h2>
      {toast && <p className={toast.kind === "error" ? "alert-error" : "alert-info"}>{toast.text}</p>}
      <form onSubmit={submit} className="card grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name</label><input className="input" required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">City</label><input className="input" required minLength={2} maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><label className="label">Address</label><input className="input" required minLength={3} maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div><label className="label">Capacity</label><input type="number" min={1} max={500000} step={1} className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
        <div className="flex items-end gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save venue" : "Add venue"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm({ name: "", address: "", city: "", capacity: "", image: "" }); }}>Cancel</button>}
        </div>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50 text-left">
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {venues?.items.map((v) => (
              <tr key={v.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3">{v.city}</td>
                <td className="px-4 py-3">{v.capacity ?? "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button className="btn-secondary mr-2 !px-3 !py-1 text-xs" onClick={() => { setEditingId(v.id); setForm({ name: v.name, address: v.address, city: v.city, capacity: v.capacity?.toString() ?? "", image: v.image ?? "" }); }}>Edit</button>
                  <button className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => void remove(v)}>Delete</button>
                </td>
              </tr>
            ))}
            {venues && venues.items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No venues yet</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

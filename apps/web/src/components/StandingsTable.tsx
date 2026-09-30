import type { StandingsDto } from "@tournament/shared";
import { Link } from "react-router-dom";

/** Shared standings table — public page, admin read-only view, homepage card. */
export function StandingsTable({ standings, compact = false }: { standings: StandingsDto; compact?: boolean }) {
  const cols: Array<[string, (r: StandingsDto["rows"][number]) => React.ReactNode]> = compact
    ? [
        ["#", (r) => r.position],
        ["Team", (r) => <Link to={`/teams/${r.teamId}`} className="font-medium text-brand-700 hover:underline">{r.shortName}</Link>],
        ["P", (r) => r.played],
        ["GD", (r) => (r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference)],
        ["Pts", (r) => <b>{r.points}</b>],
      ]
    : [
        ["#", (r) => r.position],
        ["Team", (r) => (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: r.color1 }} />
            {r.logo && <img src={r.logo} alt="" className="h-5 w-5 object-contain" />}
            <Link to={`/teams/${r.teamId}`} className="font-medium text-brand-700 hover:underline">{r.teamName}</Link>
          </span>
        )],
        ["P", (r) => r.played],
        ["W", (r) => r.won],
        ["D", (r) => r.drawn],
        ["L", (r) => r.lost],
        ["GF", (r) => r.goalsFor],
        ["GA", (r) => r.goalsAgainst],
        ["GD", (r) => (r.goalDifference > 0 ? `+${r.goalDifference}` : `${r.goalDifference}`)],
        ["Pts", (r) => <b>{r.points}</b>],
      ];

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left">
          {cols.map(([h]) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {standings.rows.length === 0 ? (
          <tr><td colSpan={cols.length} className="px-3 py-4 text-center text-slate-400">No teams yet.</td></tr>
        ) : (
          standings.rows.map((r) => (
            <tr key={r.teamId} className="border-b border-slate-100 last:border-0">
              {cols.map(([h, render]) => <td key={h} className="px-3 py-2">{render(r)}</td>)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

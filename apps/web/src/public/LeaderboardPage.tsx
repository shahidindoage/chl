import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import * as api from "../api/fan-engagement.client.js";
import { PageHero } from "../components/PageHero.js";

/** Public leaderboard — quiz points + correct predictions, aggregated. */
export function LeaderboardPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.getLeaderboard>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLeaderboard(50).then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHero
        title="Leaderboard"
        description="Quiz points and correct predictions, combined into one table."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Leaderboard" }]}
      />

      <div className="mx-auto mt-8 max-w-7xl">
        {error ? (
          <p className="alert-error">{error}</p>
        ) : !rows ? (
          <p className="text-slate-400">Loading leaderboard…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <Trophy className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Nobody has scored yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Play a quiz or land a correct prediction to take the top spot.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3 pl-4 pr-2 text-center">#</th>
                  <th className="px-3 py-3">Supporter</th>
                  <th className="px-3 py-3 text-center">Quiz</th>
                  <th className="px-3 py-3 text-center">Predictions</th>
                  <th className="py-3 pl-3 pr-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={r.userId} className={i === 0 ? "bg-emerald-50/40" : ""}>
                    <td className="relative py-3 pl-4 pr-2 text-center font-bold text-slate-600">
                      {i === 0 && <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-[#16a34a]" />}
                      {i + 1}
                    </td>
                    <td className="px-3 py-3 font-semibold text-navy">{r.name}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{r.quizPoints}</td>
                    <td className="px-3 py-3 text-center text-slate-600">{r.predictionPoints}</td>
                    <td className="py-3 pl-3 pr-4 text-right font-bold text-navy">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
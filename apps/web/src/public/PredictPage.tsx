import type { MatchDto } from "@tournament/shared";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

import * as matchApi from "../api/match.client.js";
import * as fansApi from "../api/fan-engagement.client.js";
import { apiErrorMessage } from "../api/client.js";
import { PageHero } from "../components/PageHero.js";
import { PredictModal } from "../components/PredictRunner.js";
import { TeamCrest } from "../components/TeamCrest.js";
import { formatMatchDate, formatMatchTime } from "../lib/format.js";
import { useAuthStore } from "../store/auth.store.js";

/**
 * Predict a match winner before kickoff (Section 8 Module 8).
 *
 * Cards show the fixture; clicking opens the prediction popup. Guests get the
 * same list and the popup renders locked, so the page is browsable before
 * sign-in rather than a dead end.
 */
export function PredictPage() {
  const isSignedIn = useAuthStore((s) => s.status === "authenticated");
  const [matches, setMatches] = useState<MatchDto[] | null>(null);
  const [predicting, setPredicting] = useState<MatchDto | null>(null);
  const [mine, setMine] = useState<Map<string, { isCorrect: boolean | null }>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    matchApi
      .listMatches({ page: 1, limit: 50, status: "upcoming" })
      .then((d) => {
        const open = d.items.filter((m) => new Date(m.date).getTime() > Date.now());
        setMatches(open);
        if (!isSignedIn) return;
        // Failure here just leaves the CTA visible; the popup still guards.
        Promise.all(
          open.slice(0, 24).map((m) =>
            fansApi
              .getMyPrediction(m.id)
              .then((p) => (p ? [m.id, { isCorrect: p.isCorrect }] as const : null))
              .catch(() => null)
          )
        ).then((rows) => {
          const entries = rows.filter((r): r is readonly [string, { isCorrect: boolean | null }] => r !== null);
          if (entries.length > 0) setMine(new Map(entries));
        });
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, [isSignedIn]);

  return (
    <div>
      <PageHero
        title="Predict"
        description="Call the winner before kickoff. Correct predictions score a point."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Predict" }]}
      />

      <div className="mt-8">
        {error ? (
          <p className="alert-error">{error}</p>
        ) : !matches ? (
          <p className="text-slate-400">Loading fixtures…</p>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No predictions open</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Predictions close at kickoff, so any fixture whose time has passed is no longer available.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => {
              const prediction = mine.get(m.id);
              const locked = Boolean(prediction);
              return (
                <div
                  key={m.id}
                  className={`flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ${
                    locked ? "" : "transition-all duration-200 hover:border-orange-200 hover:shadow-md"
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatMatchDate(m.date)} · {formatMatchTime(m.date)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                      <TeamCrest name={m.teamA.name} shortName={m.teamA.shortName} color1={m.teamA.color1} logo={m.teamA.logo} size="md" />
                      <span className="mt-1.5 text-xs font-bold text-navy">{m.teamA.shortName}</span>
                    </div>
                    <span className="shrink-0 text-xs font-extrabold text-slate-400">VS</span>
                    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                      <TeamCrest name={m.teamB.name} shortName={m.teamB.shortName} color1={m.teamB.color1} logo={m.teamB.logo} size="md" />
                      <span className="mt-1.5 text-xs font-bold text-navy">{m.teamB.shortName}</span>
                    </div>
                  </div>

                  {locked ? (
                    <span className="mt-3 border-t border-slate-100 pt-2 text-center text-xs font-semibold text-slate-500">
                      {prediction?.isCorrect === true
                        ? "Correct!"
                        : prediction?.isCorrect === false
                          ? "Not this time"
                          : "Prediction locked in"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPredicting(m)}
                      className="mt-3 w-full border-t border-slate-100 pt-2 text-center text-xs font-semibold text-pitch-orange-dark hover:underline"
                    >
                      Predict now →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PredictModal match={predicting} onClose={() => setPredicting(null)} />
    </div>
  );
}
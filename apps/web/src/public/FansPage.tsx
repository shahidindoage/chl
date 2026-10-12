import type { MatchDto, PredictionDto, QuizDto } from "@tournament/shared";
import { ArrowRight, Clock, Sparkles, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as fansApi from "../api/fan-engagement.client.js";
import * as matchApi from "../api/match.client.js";
import { PageHero } from "../components/PageHero.js";
import { PredictModal } from "../components/PredictRunner.js";
import { QuizModal } from "../components/QuizRunner.js";
import { SectionEyebrow } from "../components/SectionEyebrow.js";
import { TeamCrest } from "../components/TeamCrest.js";
import { formatMatchDate, formatMatchTime } from "../lib/format.js";
import { useAuthStore } from "../store/auth.store.js";
import { useSeo } from "../hooks/useSeo.js";

/**
 * Fans area — the single home for supporter features (Section 8 Module 8).
 * Each section previews real data and links to the full page, so /fans is a
 * hub rather than a dead end while /quizzes, /predict and /leaderboard keep
 * their dedicated routes.
 */

const SECTION_LINK =
  "inline-flex items-center gap-1.5 text-xs font-bold text-pitch-orange-dark hover:underline";

export function FansPage() {
  useSeo();
  return (
    <div>
      <PageHero
        title="Fans"
        description="Quizzes, predictions and the supporter leaderboard — everything here scores you a place on the table."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Fans" }]}
      />

      <div className="mx-auto max-w-7xl py-12">
        <QuizzesSection />
        <PredictSection />
        <LeaderboardSection />
      </div>
    </div>
  );
}

/* ---------------- Quizzes ---------------- */

function QuizzesSection() {
  const [quizzes, setQuizzes] = useState<QuizDto[] | null>(null);
  const [playing, setPlaying] = useState<QuizDto | null>(null);

  useEffect(() => {
    fansApi
      .listQuizzes({ limit: 4 })
      .then((d) => setQuizzes(d.items))
      .catch(() => setQuizzes([]));
  }, []);

  return (
    <section className="mb-14">
      <SectionHeader label="Play Quiz" title="Test your league knowledge" to="/quizzes" linkLabel="All quizzes" />

      {/* Closed and draft quizzes aren't playable, so they're hidden rather than
          shown disabled. The quiz manager still works with them in /admin/fans. */}
      {(() => {
        if (!quizzes) return <Loading />;
        const playable = quizzes.filter((q) => q.status === "active");
        if (playable.length === 0) {
          return (
            <EmptyState
              title="No quizzes yet"
              body="New quizzes appear here as the quiz manager publishes them."
            />
          );
        }
        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {playable.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setPlaying(q)}
                    className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pitch-orange-dark">
                        <Trophy className="h-4 w-4" />
                        {q.questions.length} questions
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-base font-extrabold leading-snug text-navy group-hover:text-pitch-orange-dark">
                      {q.title}
                    </h3>
                    {q.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{q.description}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                      <span>{q.pointsPerQuestion} pts each</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-pitch-orange-dark">
                        Play <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
              ))}
          </div>
        );
      })()}

      <QuizModal quiz={playing} onClose={() => setPlaying(null)} />
    </section>
  );
}

/* ---------------- Predict ---------------- */

function PredictSection() {
  const user = useAuthStore((s) => s.user);
  const [matches, setMatches] = useState<MatchDto[] | null>(null);
  const [predicting, setPredicting] = useState<MatchDto | null>(null);
  // matchId -> my prediction, so a locked fixture doesn't advertise a CTA
  // that the API would reject with a 409.
  const [mine, setMine] = useState<Map<string, PredictionDto>>(new Map());

  useEffect(() => {
    matchApi
      .listMatches({ page: 1, limit: 50, status: "upcoming" })
      .then((d) => {
        const open = d.items.filter((m) => new Date(m.date).getTime() > Date.now());
        setMatches(open);
        if (!user) return;
        // Failures here just leave the CTA visible; the modal still guards.
        Promise.all(
          open.slice(0, 4).map((m) =>
            fansApi
              .getMyPrediction(m.id)
              .then((p) => (p ? [m.id, p] as const : null))
              .catch(() => null)
          )
        ).then((rows) => {
          const entries = rows.filter((r): r is readonly [string, PredictionDto] => r !== null);
          if (entries.length > 0) setMine(new Map(entries));
        });
      })
      .catch(() => setMatches([]));
  }, [user]);

  return (
    <section className="mb-14">
      <SectionHeader
        label="Predict"
        title="Call the winner before kickoff"
        to="/predict"
        linkLabel="All fixtures"
      />

      {!matches ? (
        <Loading />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No predictions open"
          body="Predictions close at kickoff, so any fixture whose time has passed is no longer available."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {matches.slice(0, 4).map((m) => {
            const locked = mine.has(m.id);
            const settled = mine.get(m.id)?.isCorrect;
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
                  <span className="mt-3 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-2 text-center text-xs font-semibold text-slate-500">
                    {settled === true ? "Correct!" : settled === false ? "Not this time" : "Prediction locked in"}
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

      <PredictModal match={predicting} onClose={() => setPredicting(null)} />
    </section>
  );
}

/* ---------------- Leaderboard ---------------- */

function LeaderboardSection() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fansApi.getLeaderboard>> | null>(null);

  useEffect(() => {
    fansApi.getLeaderboard(5).then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section>
      <SectionHeader
        label="Leaderboard"
        title="Top supporters"
        to="/leaderboard"
        linkLabel="Full table"
      />

      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nobody has scored yet"
          body="Play a quiz or land a correct prediction to take the top spot."
        />
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
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2 font-semibold text-navy">
                      <User className="h-4 w-4 text-slate-400" />
                      {r.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">{r.quizPoints}</td>
                  <td className="px-3 py-3 text-center text-slate-600">{r.predictionPoints}</td>
                  <td className="py-3 pl-3 pr-4 text-right font-bold text-navy">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Shared bits ---------------- */

function SectionHeader({ label, title, to, linkLabel }: { label: string; title: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <SectionEyebrow label={label} />
        <h2 className="mt-1.5 font-display text-2xl font-extrabold text-navy sm:text-3xl">{title}</h2>
      </div>
      <Link to={to} className={SECTION_LINK}>
        <span>{linkLabel}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Loading() {
  return <p className="text-sm text-slate-400">Loading…</p>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-slate-300" />
      <p className="mt-2 text-sm font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">{body}</p>
    </div>
  );
}
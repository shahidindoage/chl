import type { QuizDto } from "@tournament/shared";
import { ArrowRight, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import * as api from "../api/fan-engagement.client.js";
import { PageHero } from "../components/PageHero.js";
import { QuizModal } from "../components/QuizRunner.js";

/** Public quiz list + taking a quiz (Section 8 Module 8). */
export function QuizPage() {
  const [quizzes, setQuizzes] = useState<QuizDto[] | null>(null);
  const [active, setActive] = useState<QuizDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listQuizzes({ limit: 50 })
      .then((d) => setQuizzes(d.items))
      .catch((e) => setError(e.message));
  }, []);

  // Closed and draft quizzes aren't playable, so they're filtered out entirely
  // rather than shown disabled. Managers manage them in /admin/fans.
  const playable = (quizzes ?? []).filter((q) => q.status === "active");

  // Playing a quiz opens a popup; the list stays the page.
  return (
    <div>
      <PageHero
        title="Quizzes"
        description="Test your knowledge of the league. One attempt per quiz."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Quizzes" }]}
      />

      <div className="mt-8">
        {error ? (
          <p className="alert-error">{error}</p>
        ) : !quizzes ? (
          <p className="text-slate-400">Loading quizzes…</p>
        ) : playable.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No quizzes yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">New quizzes appear here as they are published.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {playable.map((q) => (
              <button
                key={q.id}
                onClick={() => setActive(q)}
                className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pitch-orange-dark">
                  <Trophy className="h-4 w-4" />
                  {q.questions.length} questions
                </span>

                <h2 className="mt-2 font-display text-lg font-extrabold text-navy group-hover:text-pitch-orange-dark">
                  {q.title}
                </h2>
                {q.description && <p className="mt-1 text-sm text-slate-500">{q.description}</p>}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>{q.pointsPerQuestion} pts per question</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-pitch-orange-dark">
                    Play <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <QuizModal quiz={active} onClose={() => setActive(null)} />
    </div>
  );
}
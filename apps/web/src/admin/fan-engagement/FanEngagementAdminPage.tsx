import type { QuizDto, QuizOption } from "@tournament/shared";
import { useCallback, useEffect, useState } from "react";

import * as api from "../../api/fan-engagement.client.js";
import { apiErrorMessage } from "../../api/client.js";

/**
 * Module 8 admin — quiz creator, attempt overview, leaderboard.
 * Exclusive to quiz_manager (plus super_admin via the wildcard).
 */

interface DraftQuestion {
  question: string;
  type: "single_choice" | "true_false";
  options: { key: string; label: string }[];
  correctKey: string;
}

function emptyQuestion(index: number): DraftQuestion {
  const a = String.fromCharCode(97 + index * 2);
  const b = String.fromCharCode(98 + index * 2);
  return {
    question: "",
    type: "single_choice",
    options: [
      { key: a, label: "" },
      { key: b, label: "" },
    ],
    correctKey: a,
  };
}

function quizToDraft(q: QuizDto): DraftQuestion[] {
  return q.questions.map((question) => ({
    question: question.question,
    type: question.type,
    options: question.options.map((o) => ({ ...o })),
    correctKey: ("correctKey" in question ? (question as { correctKey: string }).correctKey : question.options[0]?.key) ?? "",
  }));
}

export function FanEngagementAdminPage() {
  const [tab, setTab] = useState<"quizzes" | "attempts" | "leaderboard">("quizzes");
  const [quizzes, setQuizzes] = useState<QuizDto[] | null>(null);
  const [editing, setEditing] = useState<QuizDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.listQuizzes({ limit: 50 }).then((d) => setQuizzes(d.items)).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  useEffect(load, [load]);

  if (error) return <p className="alert-error">{error}</p>;
  if (creating || editing) {
    return (
      <QuizEditor
        quiz={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Fan Engagement</h1>
      <p className="mb-4 text-sm text-slate-500">
        Quizzes, predictions and the supporter leaderboard. Only active quizzes accept attempts.
      </p>

      <div className="mb-5 flex gap-2">
        {(
          [
            ["quizzes", "Quizzes"],
            ["attempts", "Attempts"],
            ["leaderboard", "Leaderboard"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "quizzes" && (
        <div>
          <div className="mb-3 flex justify-end">
            <button className="btn-primary" onClick={() => setCreating(true)}>
              New quiz
            </button>
          </div>

          {!quizzes ? (
            <p className="text-slate-400">Loading quizzes…</p>
          ) : quizzes.length === 0 ? (
            <p className="text-sm text-slate-400">No quizzes yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Questions</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((q) => (
                    <tr key={q.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-semibold">{q.title}</div>
                        <div className="text-xs text-slate-400">{q.pointsPerQuestion} pts per question</div>
                      </td>
                      <td className="px-3 py-2">{q.questions.length}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => setEditing(q)}>
                          Edit
                        </button>
                        <button
                          className="ml-3 text-xs font-semibold text-slate-600 hover:underline"
                          onClick={() => {
                            const next = q.status === "active" ? "closed" : "active";
                            void api.setQuizStatus(q.id, next).then(load);
                          }}
                        >
                          {q.status === "active" ? "Close" : "Activate"}
                        </button>
                        <button
                          className="ml-3 text-xs font-semibold text-red-600 hover:underline"
                          onClick={() => {
                            if (confirm(`Delete "${q.title}"? Fan scores are deleted too.`)) {
                              void api.deleteQuiz(q.id).then(load);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "attempts" && <AttemptsTab quizzes={quizzes ?? []} />}
      {tab === "leaderboard" && <LeaderboardTab />}
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "active" | "closed" }) {
  const tone =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "closed"
        ? "bg-slate-200 text-slate-600"
        : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>{status}</span>;
}

function AttemptsTab({ quizzes }: { quizzes: QuizDto[] }) {
  const [quizId, setQuizId] = useState("");
  const [rows, setRows] = useState<{ attempts: { userId: string; score: number; maxScore: number; submittedAt: string }[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    api.listQuizAttempts(quizId).then(setRows).catch((e) => setError(apiErrorMessage(e)));
  }, [quizId]);

  if (error) return <p className="alert-error">{error}</p>;

  return (
    <div>
      <select className="input mb-3 w-auto" value={quizId} onChange={(e) => setQuizId(e.target.value)} aria-label="Quiz">
        <option value="">Select a quiz…</option>
        {quizzes.map((q) => (
          <option key={q.id} value={q.id}>
            {q.title}
          </option>
        ))}
      </select>

      {!quizId ? (
        <p className="text-sm text-slate-400">Pick a quiz to see who attempted it.</p>
      ) : !rows ? (
        <p className="text-slate-400">Loading attempts…</p>
      ) : rows.total === 0 ? (
        <p className="text-sm text-slate-400">No attempts yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-3 py-2">Fan</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.attempts.map((a) => (
                <tr key={a.userId} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{a.userId.slice(0, 8)}</td>
                  <td className="px-3 py-2 font-bold">
                    {a.score} / {a.maxScore}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(a.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeaderboardTab() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.getLeaderboard>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLeaderboard(50).then(setRows).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;
  if (!rows) return <p className="text-slate-400">Loading leaderboard…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-400">No scores recorded yet.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Supporter</th>
            <th className="px-3 py-2 text-center">Quiz</th>
            <th className="px-3 py-2 text-center">Predictions</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.userId} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-2 font-bold text-slate-500">{i + 1}</td>
              <td className="px-3 py-2 font-semibold">{r.name}</td>
              <td className="px-3 py-2 text-center">{r.quizPoints}</td>
              <td className="px-3 py-2 text-center">{r.predictionPoints}</td>
              <td className="px-3 py-2 text-right font-bold">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuizEditor({
  quiz,
  onClose,
  onSaved,
}: {
  quiz: QuizDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [points, setPoints] = useState(quiz?.pointsPerQuestion ?? 1);
  const [status, setStatus] = useState<"draft" | "active" | "closed">(quiz?.status ?? "draft");
  const [questions, setQuestions] = useState<DraftQuestion[]>(quiz ? quizToDraft(quiz) : [emptyQuestion(0)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (i: number, next: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...next } : q)));

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion(qs.length)]);

  const removeQuestion = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const save = async () => {
    setBusy(true);
    setError(null);
    const payload = {
      title,
      description: description || null,
      status,
      pointsPerQuestion: points,
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        options: q.options.filter((o) => o.label.trim()) as QuizOption[],
        correctKey: q.correctKey,
      })),
    };
    try {
      if (quiz) await api.updateQuiz(quiz.id, payload);
      else await api.createQuiz(payload);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-bold">{quiz ? "Edit quiz" : "New quiz"}</h2>
      {error && <p className="alert-error mb-3">{error}</p>}

      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="q-title">Title</label>
          <input id="q-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="q-desc">Description</label>
          <textarea id="q-desc" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="q-points">Points per question</label>
            <input
              id="q-points"
              type="number"
              min={1}
              max={100}
              className="input"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="q-status">Status</label>
            <select id="q-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <h3 className="mt-5 mb-2 text-sm font-bold">Questions</h3>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start gap-2">
              <input
                className="input"
                placeholder={`Question ${i + 1}`}
                value={q.question}
                onChange={(e) => patch(i, { question: e.target.value })}
              />
              {questions.length > 1 && (
                <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => removeQuestion(i)}>
                  Remove
                </button>
              )}
            </div>

            <div className="mt-2 space-y-1">
              {q.options.map((o, oi) => (
                <div key={o.key} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correctKey === o.key}
                    onChange={() => patch(i, { correctKey: o.key })}
                    aria-label={`Mark option ${oi + 1} correct`}
                  />
                  <input
                    className="input"
                    placeholder={`Option ${oi + 1}`}
                    value={o.label}
                    onChange={(e) =>
                      patch(i, { options: q.options.map((x, xIdx) => (xIdx === oi ? { ...x, label: e.target.value } : x)) })
                    }
                  />
                  {q.options.length > 2 && (
                    <button
                      className="text-xs text-slate-400 hover:text-red-600"
                      onClick={() => patch(i, { options: q.options.filter((_, xIdx) => xIdx !== oi) })}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => patch(i, { options: [...q.options, { key: `o${q.options.length + 1}`, label: "" }] })}>
                + option
              </button>
              <button
                className="text-xs font-semibold text-brand-600 hover:underline"
                onClick={() =>
                  patch(i, {
                    type: "true_false",
                    options: [
                      { key: "t", label: "True" },
                      { key: "f", label: "False" },
                    ],
                    correctKey: "t",
                  })
                }
              >
                Make true/false
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-secondary mt-3" onClick={addQuestion}>
        + Add question
      </button>

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Save quiz"}
        </button>
        <button className="btn-secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
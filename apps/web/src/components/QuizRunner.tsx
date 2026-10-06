import type { QuizDto } from "@tournament/shared";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import * as api from "../api/fan-engagement.client.js";
import { apiErrorMessage } from "../api/client.js";
import { useHomeData } from "../public/home/HomeDataContext.js";
import { useAuthStore } from "../store/auth.store.js";

/**
 * Module 8 — quiz taking UI, shared by the /quizzes page (inline) and the
 * fans hub (modal). Attempting is once per quiz, so an existing attempt
 * short-circuits to the score screen instead of re-submitting.
 *
 * Guests can browse quizzes but not answer them (the API requires a token to
 * submit), so a signed-out visitor sees the questions behind a lock rather
 * than a form that would fail on submit.
 */

interface RunnerProps {
  quiz: QuizDto;
  onExit: () => void;
  /** Label for the exit button — "All quizzes" on the page, "Close" in a modal. */
  exitLabel?: string;
}

function useQuizAttempt(quiz: QuizDto) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<{ score: number; maxScore: number } | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True only while the "have I already sat this?" lookup is in flight. Without
  // this the questions would flash for a quiz that's already attempted.
  const [checking, setChecking] = useState(false);

  // isSignedIn is a dependency on purpose: a guest opens the locked popup,
  // signs in from inside it, and must then re-fetch — otherwise the stale
  // anonymous state leaves a form for a quiz they already sat.
  const isSignedIn = useAuthStore((s) => s.status === "authenticated");

  useEffect(() => {
    setPicks({});
    setExisting(null);
    setResult(null);
    setError(null);
    if (!isSignedIn) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    api
      .getMyAttempt(quiz.id)
      .then((a) => !cancelled && setExisting(a ? { score: a.score, maxScore: a.maxScore } : null))
      .catch(() => undefined)
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [quiz.id, isSignedIn]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const answers = Object.entries(picks).map(([questionId, selectedKey]) => ({ questionId, selectedKey }));
      const attempt = await api.submitAttempt(quiz.id, { answers });
      setResult({ score: attempt.score, maxScore: attempt.maxScore });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit"));
    } finally {
      setBusy(false);
    }
  };

  const answered = Object.keys(picks).length;
  return { picks, setPicks, existing, result, busy, error, submit, answered, isSignedIn, checking };
}

/** Body only — caller supplies its own chrome. */
export function QuizRunner({ quiz, onExit, exitLabel = "All quizzes" }: RunnerProps) {
  const { picks, setPicks, existing, result, busy, error, submit, answered, isSignedIn, checking } =
    useQuizAttempt(quiz);
  const { openAuth } = useHomeData();

  if (!isSignedIn) {
    return <LockedQuiz quiz={quiz} onSignIn={openAuth} />;
  }

  // Hold the questions back until we know whether this quiz is already
  // attempted — otherwise signing in from the locked popup flashes a submittable
  // form for a finished attempt.
  if (checking) {
    return <p className="py-8 text-center text-xs text-slate-400">Checking your attempt…</p>;
  }

  if (result || existing) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center">
        <p className="text-3xl font-black text-emerald-700">
          {(result ?? existing)?.score} / {(result ?? existing)?.maxScore}
        </p>
        <p className="mt-1 text-sm font-semibold text-emerald-800">
          {result ? "Submitted — here is your score" : "You already attempted this quiz"}
        </p>
        <button className="btn-secondary mt-4" onClick={onExit}>
          Back to {exitLabel.toLowerCase()}
        </button>
      </div>
    );
  }

  return (
    <>
      {error && <p className="alert-error mb-4">{error}</p>}

      <div className="space-y-5">
        {quiz.questions.map((question, qi) => (
          <fieldset key={question.id}>
            <legend className="text-sm font-bold text-navy">
              {qi + 1}. {question.question}
            </legend>
            <div className="mt-2 space-y-1">
              {question.options.map((o) => (
                <label key={o.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={question.id}
                    checked={picks[question.id] === o.key}
                    onChange={() => setPicks((p) => ({ ...p, [question.id]: o.key }))}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-xs text-slate-400">
          {answered} of {quiz.questions.length} answered
        </span>
        <button className="btn-primary" onClick={() => void submit()} disabled={busy || answered === 0}>
          {busy ? "Submitting…" : "Submit answers"}
        </button>
      </div>
    </>
  );
}

/**
 * Signed-out state: the real questions are shown but blurred behind a
 * watermark, so a visitor can see what the quiz covers without being able to
 * answer it. Nothing interactive is exposed — no radios, no submit.
 */
function LockedQuiz({ quiz, onSignIn }: { quiz: QuizDto; onSignIn: () => void }) {
  return (
    <div className="relative">
      {/* Blurred, non-interactive preview of the actual questions. */}
      <div aria-hidden="true" className="pointer-events-none select-none space-y-5 blur-[3px]">
        {quiz.questions.map((question, qi) => (
          <fieldset key={question.id}>
            <legend className="text-sm font-bold text-navy">
              {qi + 1}. {question.question}
            </legend>
            <div className="mt-2 space-y-1">
              {question.options.map((o) => (
                <div key={o.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-400" />
                  {o.label}
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Watermark + sign-in prompt sit over the blur. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/55 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/85 text-white shadow-lg">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-extrabold text-navy">Sign in to play</p>
          <p className="mx-auto mt-1 max-w-[16rem] text-xs text-slate-600">
            {quiz.questions.length} questions · one attempt each. Answers are scored and count toward the
            leaderboard.
          </p>
        </div>
        <button
          onClick={onSignIn}
          className="rounded-full bg-pitch-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pitch-orange-dark"
        >
          Sign in
        </button>
        <p className="text-[11px] text-slate-500">Browsing is free — no account needed to read</p>
      </div>
    </div>
  );
}

/** Popup variant used on the fans hub. Portalled to <body> so it escapes any
 *  fixed/backdrop-filtered ancestor — the same trap the AuthModal hit. */
export function QuizModal({ quiz, onClose }: { quiz: QuizDto | null; onClose: () => void }) {
  useEffect(() => {
    if (!quiz) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [quiz, onClose]);

  if (!quiz) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10 backdrop-blur-sm sm:pt-16"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={quiz.title}
      >
        <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold text-navy">{quiz.title}</h2>
              {quiz.description && <p className="mt-1 text-sm text-slate-500">{quiz.description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close quiz"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <QuizRunner quiz={quiz} onExit={onClose} exitLabel="this hub" />
        </div>
      </div>
    </div>,
    document.body
  );
}
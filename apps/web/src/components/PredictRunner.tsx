import type { MatchDto } from "@tournament/shared";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import * as api from "../api/fan-engagement.client.js";
import { apiErrorMessage } from "../api/client.js";
import { useHomeData } from "../public/home/HomeDataContext.js";
import { useAuthStore } from "../store/auth.store.js";
import { TeamCrest } from "./TeamCrest.js";

/**
 * Module 8 — prediction UI, shared by the /predict page (inline) and the
 * fans hub (modal).
 *
 * A prediction locks at kickoff and can only be made once per match, so an
 * existing prediction renders as the result instead of a form. The server
 * enforces the same rule; this just avoids showing a form that would 409.
 *
 * Guests can browse fixtures but not predict them, so a signed-out visitor
 * gets the same blurred watermark as the quiz popup rather than a picker
 * that would fail on submit.
 */

export interface PredictBodyProps {
  match: MatchDto;
  onSaved?: () => void;
}

function usePrediction(match: MatchDto) {
  const [winner, setWinner] = useState("");
  const [score, setScore] = useState("");
  const [mine, setMine] = useState<{ predictedWinnerId: string; isCorrect: boolean | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // True only while the "do I already have one?" lookup is in flight. Without
  // this the form would flash for a match that's already predicted.
  const [checking, setChecking] = useState(false);

  // isSignedIn is a dependency on purpose: a guest opens the locked popup,
  // signs in from inside it, and must then re-fetch — otherwise the stale
  // anonymous state leaves a form for a match they already predicted.
  const isSignedIn = useAuthStore((s) => s.status === "authenticated");

  useEffect(() => {
    setWinner("");
    setScore("");
    setMine(null);
    setDone(false);
    setError(null);
    if (!isSignedIn) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    api
      .getMyPrediction(match.id)
      .then((p) => !cancelled && setMine(p ? { predictedWinnerId: p.predictedWinnerId, isCorrect: p.isCorrect } : null))
      .catch(() => undefined)
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [match.id, isSignedIn]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const p = await api.submitPrediction(match.id, {
        predictedWinnerId: winner,
        predictedScore: score || null,
      });
      setMine({ predictedWinnerId: p.predictedWinnerId, isCorrect: p.isCorrect });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save prediction"));
    } finally {
      setBusy(false);
    }
  };

  return { winner, setWinner, score, setScore, mine, busy, error, submit, done, isSignedIn, checking };
}

/** Body only — caller supplies its own chrome. */
export function PredictBody({ match, onSaved }: PredictBodyProps) {
  const { winner, setWinner, score, setScore, mine, busy, error, submit, done, isSignedIn, checking } =
    usePrediction(match);
  const { openAuth } = useHomeData();

  if (!isSignedIn) {
    return <LockedPrediction match={match} onSignIn={openAuth} />;
  }

  const locked = Boolean(mine) || done;

  // Hold the form back until we know whether this match is already predicted —
  // otherwise signing in from the locked popup flashes a submittable form.
  if (checking) {
    return <p className="py-6 text-center text-xs text-slate-400">Checking your prediction…</p>;
  }
  const show = locked ? mine?.predictedWinnerId : winner;
  const settled = locked && mine?.isCorrect !== null && mine?.isCorrect !== undefined;

  return (
    <div>
      <p className="mb-3 text-center text-xs text-slate-500">
        {new Date(match.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        {match.venue ? ` · ${match.venue.name}` : ""}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: match.teamAId, name: match.teamA.name, short: match.teamA.shortName, color: match.teamA.color1, logo: match.teamA.logo },
          { id: match.teamBId, name: match.teamB.name, short: match.teamB.shortName, color: match.teamB.color1, logo: match.teamB.logo },
        ].map((t) => {
          const picked = show === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              onClick={() => setWinner(t.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                picked
                  ? settled
                    ? mine?.isCorrect
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-red-300 bg-red-50"
                    : "border-pitch-orange-dark bg-orange-50"
                  : "border-slate-200 hover:border-pitch-orange-dark"
              } ${locked ? "cursor-default opacity-90" : ""}`}
            >
              <TeamCrest name={t.name} shortName={t.short} color1={t.color} logo={t.logo} size="lg" />
              <span className="text-xs font-bold text-navy">{t.short}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="alert-error mt-3">{error}</p>}

      {locked ? (
        <div className="mt-3 text-center">
          <p className="text-xs font-semibold text-slate-600">
            {mine?.isCorrect === true ? "Correct!" : mine?.isCorrect === false ? "Not this time" : "Prediction locked in"}
          </p>
          {onSaved && (
            <button type="button" onClick={onSaved} className="btn-secondary mt-3 w-full">
              Done
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            className="input mt-3"
            placeholder="Optional scoreline, e.g. 2-1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            aria-label="Predicted scoreline"
          />
          <button
            type="button"
            className="btn-primary mt-2 w-full"
            onClick={() => void submit()}
            disabled={busy || !winner}
          >
            {busy ? "Saving…" : "Lock in prediction"}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Signed-out state: the real team picker is shown but blurred behind a
 * watermark, so a visitor can see the fixture without being able to pick a
 * winner. Nothing interactive is exposed.
 */
function LockedPrediction({ match, onSignIn }: { match: MatchDto; onSignIn: () => void }) {
  const teams = [
    { name: match.teamA.name, short: match.teamA.shortName, color: match.teamA.color1, logo: match.teamA.logo },
    { name: match.teamB.name, short: match.teamB.shortName, color: match.teamB.color1, logo: match.teamB.logo },
  ];

  return (
    <div className="relative p-5 ">
      {/* Blurred, non-interactive preview of the actual picker. */}
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3px]">
        <div className="grid grid-cols-2 gap-2">
          {teams.map((t) => (
            <div key={t.short} className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-3">
              <TeamCrest name={t.name} shortName={t.short} color1={t.color} logo={t.logo} size="lg" />
              <span className="text-xs font-bold text-navy">{t.short}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          <div className="input">Optional scoreline, e.g. 2-1</div>
          <div className="btn-primary w-full">Lock in prediction</div>
        </div>
      </div>

      {/* Watermark + sign-in prompt sit over the blur. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/55 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/85 text-white shadow-lg">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-extrabold text-navy">Sign in to predict</p>
          <p className="mx-auto mt-1 max-w-[15rem] text-xs text-slate-600">
            Pick a winner before kickoff — correct predictions score a point on the leaderboard.
          </p>
        </div>
        <button
          onClick={onSignIn}
          className="rounded-full bg-pitch-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pitch-orange-dark"
        >
          Sign in
        </button>
        <p className="text-[11px] text-slate-500">Browsing fixtures is free — no account needed</p>
      </div>
    </div>
  );
}

/** Popup variant used on the fans hub. Portalled to <body> so it escapes any
 *  fixed/backdrop-filtered ancestor — the same trap the AuthModal hit. */
export function PredictModal({ match, onClose }: { match: MatchDto | null; onClose: () => void }) {
  useEffect(() => {
    if (!match) return;
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
  }, [match, onClose]);

  if (!match) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Predict ${match.teamA.shortName} vs ${match.teamB.shortName}`}
      >
        <div className=" rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-extrabold text-navy">Make your prediction</h2>
              <p className="mt-0.5 text-xs text-slate-500">Who wins this one?</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close prediction"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <PredictBody match={match} />
        </div>
      </div>
    </div>,
    document.body
  );
}
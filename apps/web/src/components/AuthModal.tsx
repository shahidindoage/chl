import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { apiErrorMessage } from "../api/client.js";
import * as authApi from "../api/auth.client.js";
import { useAuthStore } from "../store/auth.store.js";

type Mode = "signin" | "signup";

/**
 * Public FE (Module 9): fan auth modal.
 * Sign in = email + password only.
 * Sign up = name + email + phone + password → email OTP → confirm → JWT.
 */
export function AuthModal({ open, onClose, initialMode = "signin" }: { open: boolean; onClose: () => void; initialMode?: Mode }) {
  const loginWithToken = useAuthStore((s) => s.loginWithToken);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<"form" | "otp">("form");

  // sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // sign up
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // otp
  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setStep("form");
      setError(null);
      setHint(null);
      setCode("");
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (step === "otp") codeRef.current?.focus();
  }, [step]);

  // Escape closes, matching the backdrop click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll so the page can't move behind the overlay.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const finishLogin = useCallback(
    (result: Awaited<ReturnType<typeof authApi.signIn>>) => {
      loginWithToken(result.user, result.tokens.token);
      onClose();
    },
    [loginWithToken, onClose]
  );

  const submitSignIn = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      finishLogin(await authApi.signIn({ email: siEmail, password: siPassword }));
    } catch (err) {
      setError(apiErrorMessage(err, "Sign in failed"));
    } finally {
      setBusy(false);
    }
  }, [siEmail, siPassword, finishLogin]);

  const submitSignUp = useCallback(async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await authApi.signUp({ name, email, phone, password });
      setStep("otp");
      setHint(`Code sent to ${email}. It expires in ${Math.round(result.expiresInSeconds / 60)} minutes.`);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create account"));
    } finally {
      setBusy(false);
    }
  }, [name, email, phone, password, confirmPassword]);

  const resend = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await authApi.resendOtp({ email });
      setHint("A new code has been sent.");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not resend code"));
    } finally {
      setBusy(false);
    }
  }, [email]);

  const confirm = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      finishLogin(await authApi.confirmSignUp({ email, code }));
    } catch (err) {
      setError(apiErrorMessage(err, "Could not verify code"));
    } finally {
      setBusy(false);
    }
  }, [email, code, finishLogin]);

  if (!open) return null;

  // Rendered into <body>, NOT in place. This component is mounted inside
  // <header>, which is `position: fixed` and carries `backdrop-blur` once
  // scrolled. A backdrop-filter (and any transform/filter/will-change) on an
  // ancestor makes it the containing block for `position: fixed` children, so
  // an in-place modal anchors to the header box — it drifts, clips, and scrolls
  // with the bar. A portal escapes that entirely.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={onClose}
    >
      <div
        className="card my-auto w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {step === "otp" ? "Enter your code" : mode === "signin" ? "Sign in" : "Create fan account"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>

        {step === "form" && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1 text-sm font-semibold">
            <button
              className={mode === "signin" ? "rounded bg-white py-1.5 shadow-sm" : "py-1.5 text-slate-500"}
              onClick={() => { setMode("signin"); setError(null); }}
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "rounded bg-white py-1.5 shadow-sm" : "py-1.5 text-slate-500"}
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Sign up
            </button>
          </div>
        )}

        {error && <p className="alert-error mb-3">{error}</p>}
        {hint && !error && <p className="alert-info mb-3">{hint}</p>}

        {step === "otp" ? (
          <form
            onSubmit={(e) => { e.preventDefault(); void confirm(); }}
            className="space-y-3"
          >
            <div>
              <label className="label" htmlFor="auth-code">6-digit code</label>
              <input
                id="auth-code"
                ref={codeRef}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                className="input text-center text-xl tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
              />
            </div>
            <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Confirm & sign in"}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-brand-600 hover:underline" onClick={() => void resend()} disabled={busy}>
                Resend code
              </button>
              <button type="button" className="text-slate-500 hover:underline" onClick={() => setStep("form")} disabled={busy}>
                Edit details
              </button>
            </div>
          </form>
        ) : mode === "signin" ? (
          <form
            onSubmit={(e: FormEvent) => { e.preventDefault(); void submitSignIn(); }}
            className="space-y-3"
          >
            <div>
              <label className="label" htmlFor="si-email">Email</label>
              <input id="si-email" type="email" required className="input" value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="label" htmlFor="si-password">Password</label>
              <input id="si-password" type="password" required className="input" value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
         
          </form>
        ) : (
          <form
            onSubmit={(e: FormEvent) => { e.preventDefault(); void submitSignUp(); }}
            className="space-y-3"
          >
            <div>
              <label className="label" htmlFor="su-name">Name</label>
              <input id="su-name" required className="input" value={name}
                onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="su-email">Email</label>
              <input id="su-email" type="email" required className="input" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="su-phone">Phone</label>
              <input id="su-phone" type="tel" required className="input" value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
            </div>
            <div>
              <label className="label" htmlFor="su-password">Password</label>
              <input id="su-password" type="password" required className="input" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <p className="mt-1 text-xs text-slate-400">Min 8 chars, at least one letter and one number.</p>
            </div>
            <div>
              <label className="label" htmlFor="su-confirm">Confirm password</label>
              <input id="su-confirm" type="password" required className="input" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Sending code…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

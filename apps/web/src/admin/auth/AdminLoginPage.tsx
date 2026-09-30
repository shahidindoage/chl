import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiErrorMessage } from "../../api/client.js";
import * as authApi from "../../api/auth.client.js";
import { useAuthStore } from "../../store/auth.store.js";

/** Admin FE (Module 9): email + password login for all admin roles. */
export function AdminLoginPage() {
  const loginWithToken = useAuthStore((s) => s.loginWithToken);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await authApi.signIn({ email, password });
      loginWithToken(result.user, result.tokens.token);
      navigate(result.user.role === "super_admin" ? "/admin/users" : "/admin");
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="card">
        <h1 className="mb-1 text-xl font-bold">Admin sign in</h1>
        <p className="mb-4 text-sm text-slate-500">Staff &amp; team owners use email + password. Fans use{" "}
          <Link to="/" className="underline">OTP sign-in</Link>.
        </p>
        {error && <p className="alert-error mb-3">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { Role } from "@tournament/shared";
import { ArrowRight, LogOut, Mail, Phone, Shield, User, BadgeCheck, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useHomeData } from "./home/HomeDataContext.js";
import { useAuthStore } from "../store/auth.store.js";

/**
 * Account page — the destination behind the header's user icon. Shows the
 * signed-in user's own details plus sign out. Read-only for now: profile
 * editing is a later module.
 */

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  team_owner: "Team Owner",
  content_manager: "Content Manager",
  score_manager: "Score Manager",
  quiz_manager: "Quiz Manager",
  fan: "Fan",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const text = parts.map((p) => p.charAt(0)).join("").toUpperCase();
  return text || "U";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export function AccountPage() {
  const { user, status, logout } = useAuthStore();
  const { openAuth } = useHomeData();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (status === "loading") {
    return <p className="py-16 text-center text-sm text-slate-400">Loading your account…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <UserX className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-navy">Sign in to view your account</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Your profile, contact details and role live here once you sign in or create an account.
        </p>
        <button
          onClick={openAuth}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-pitch-orange px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pitch-orange-dark"
        >
          Sign in / Create account
        </button>
      </div>
    );
  }

  const isAdmin = user.role !== "fan";

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="mb-4 text-sm">
        <Link to="/" className="text-slate-500 transition-colors hover:text-pitch-orange-dark">
          ← Back to home
        </Link>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Identity header */}
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-orange-50/40 px-6 py-8 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-pitch-orange text-2xl font-extrabold text-white shadow-sm">
            {initials(user.name)}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h1 className="truncate font-display text-2xl font-extrabold text-navy">{user.name}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pitch-orange/10 px-3 py-1 text-xs font-semibold text-pitch-orange-dark">
                <Shield className="h-3.5 w-3.5" />
                {ROLE_LABELS[user.role]}
              </span>
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Pending verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <dl className="divide-y divide-slate-100">
          <div className="flex items-center gap-4 px-6 py-4">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <dt className="w-28 shrink-0 text-sm font-medium text-slate-500">Email</dt>
            <dd className="min-w-0 break-all text-sm font-semibold text-navy">{user.email}</dd>
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <dt className="w-28 shrink-0 text-sm font-medium text-slate-500">Phone</dt>
            <dd className="text-sm font-semibold text-navy">{user.phone || "Not provided"}</dd>
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <dt className="w-28 shrink-0 text-sm font-medium text-slate-500">Member since</dt>
            <dd className="text-sm font-semibold text-navy">{formatDate(user.createdAt)}</dd>
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <Shield className="h-4 w-4 shrink-0 text-slate-400" />
            <dt className="w-28 shrink-0 text-sm font-medium text-slate-500">Role</dt>
            <dd className="text-sm font-semibold text-navy">{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row">
          <button
            onClick={() => {
              setSigningOut(true);
              void logout().then(() => {
                setSigningOut(false);
                navigate("/");
              });
            }}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              Go to admin panel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* <p className="mt-4 text-center text-xs text-slate-400">
        Profile editing and avatar uploads arrive with a later module.
      </p> */}
    </div>
  );
}

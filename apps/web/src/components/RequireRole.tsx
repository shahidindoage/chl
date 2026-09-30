import type { Role } from "@tournament/shared";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/auth.store.js";

/** Route guard mirroring the backend requireRole() (Section 7 map). */
export function RequireRole({ roles, children }: { roles: Role[]; children: JSX.Element }) {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status === "loading") {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-400">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  const allowed = user.role === "super_admin" || roles.includes(user.role);
  if (!allowed) {
    return <div className="alert-error mx-auto mt-16 max-w-md">You don't have access to this area.</div>;
  }
  return children;
}

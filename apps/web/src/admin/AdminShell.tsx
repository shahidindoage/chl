import type { Role } from "@tournament/shared";
import { NavLink, Outlet } from "react-router-dom";

import { useAuthStore } from "../store/auth.store.js";

/**
 * Module 10 — admin shell.
 *
 * Every link is gated by role here rather than relying on the route guard. The
 * API is still the enforcement point; this just stops a manager seeing links
 * that would 403. Mirrors the permission map in
 * apps/api/src/core/config/permissions.ts.
 */

interface AdminNavItem {
  to: string;
  label: string;
  /** Roles allowed to see and use the link. super_admin is implicit. */
  roles: Role[];
  end?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", roles: [], end: true },
  { to: "/admin/tournaments", label: "Tournaments", roles: ["super_admin"] },
  { to: "/admin/teams", label: "Teams", roles: ["super_admin", "team_owner"] },
  { to: "/admin/players", label: "Players", roles: ["super_admin", "team_owner"] },
  { to: "/admin/matches", label: "Matches", roles: ["super_admin", "score_manager"] },
  { to: "/admin/live", label: "Live control", roles: ["super_admin", "score_manager"] },
  { to: "/admin/standings", label: "Standings", roles: [] },
  {
    to: "/admin/news",
    label: "News & media",
    roles: ["super_admin", "content_manager"],
  },
  { to: "/admin/fans", label: "Quizzes", roles: ["super_admin", "quiz_manager"] },
  { to: "/admin/users", label: "Users", roles: ["super_admin"] },
  {
    to: "/admin/activity",
    label: "Activity log",
    roles: ["super_admin", "team_owner", "content_manager", "score_manager", "quiz_manager"],
  },
];

export function AdminShell() {
  const role = useAuthStore((s) => s.user?.role);
  const user = useAuthStore((s) => s.user);
  // An empty roles array means "every admin role" (standings, dashboard).
  const items = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || (role !== undefined && item.roles.includes(role))
  );

  return (
    <div className="lg:flex lg:gap-8">
      <aside className="mb-6 lg:mb-0 lg:w-56 lg:shrink-0">
        <div className="mb-4">
          <p className="font-display text-lg font-extrabold text-navy">Admin</p>
          {user && <p className="text-xs text-slate-500">{user.name}</p>}
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm lg:flex-col lg:gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-2 py-1.5 font-medium transition-colors ${
                  isActive
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-navy"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
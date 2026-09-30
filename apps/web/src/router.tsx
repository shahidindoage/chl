import { Link, Outlet } from "react-router-dom";

import { AdminLoginPage } from "./admin/auth/AdminLoginPage.js";
import { UserManagementPage } from "./admin/auth/UserManagementPage.js";
import { MatchAdminPage } from "./admin/match/MatchAdminPage.js";
import { LiveControlPanelPage } from "./admin/live-score/LiveControlPanelPage.js";
import { StandingsAdminView } from "./admin/standings/StandingsAdminView.js";
import { PlayerAdminPage } from "./admin/player/PlayerAdminPage.js";
import { TeamAdminPage } from "./admin/team/TeamAdminPage.js";
import { TournamentAdminPage } from "./admin/tournament/TournamentAdminPage.js";
import { AppShell } from "./components/AppShell.js";
import { RequireRole } from "./components/RequireRole.js";
import { AccountPage } from "./public/AccountPage.js";
import { HomePage } from "./public/HomePage.js";
import { FansPage } from "./public/FansPage.js";
import { NewsPage } from "./public/NewsPage.js";
import { MatchDetailPage } from "./public/MatchDetailPage.js";
import { MatchesPage } from "./public/MatchesPage.js";
import { LiveMatchPage } from "./public/LiveMatchPage.js";
import { StandingsPage } from "./public/StandingsPage.js";
import { PlayerProfilePage } from "./public/PlayerProfilePage.js";
import { PlayersPage } from "./public/PlayersPage.js";
import { TeamProfilePage } from "./public/TeamProfilePage.js";
import { TeamsPage } from "./public/TeamsPage.js";
import { TournamentInfoPage } from "./public/TournamentInfoPage.js";
import { VenueDetailPage, VenuesPage } from "./public/VenuesPage.js";
import { useAuthStore } from "./store/auth.store.js";

/**
 * Router. The shell (site header, footer, homepage modals) wraps every
 * route, so the admin area inherits the same chrome as the public pages.
 */
export function AppRoutes() {
  return <AppShell />;
}

export const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/account", element: <AccountPage /> },
  { path: "/tournaments/:id", element: <TournamentInfoPage /> },
  { path: "/teams", element: <TeamsPage /> },
  { path: "/teams/:id", element: <TeamProfilePage /> },
  { path: "/players", element: <PlayersPage /> },
  { path: "/players/:id", element: <PlayerProfilePage /> },
  { path: "/venues", element: <VenuesPage /> },
  { path: "/venues/:id", element: <VenueDetailPage /> },
  { path: "/matches", element: <MatchesPage /> },
  { path: "/matches/:id", element: <MatchDetailPage /> },
  { path: "/matches/:id/live", element: <LiveMatchPage /> },
  { path: "/news", element: <NewsPage /> },
  { path: "/fans", element: <FansPage /> },
  { path: "/standings", element: <StandingsPage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: (
      <RequireRole
        roles={["super_admin", "team_owner", "content_manager", "score_manager", "quiz_manager"]}
      >
        <AdminShell />
      </RequireRole>
    ),
    children: [
      { index: true, element: <AdminHomeNote /> },
      {
        path: "tournaments",
        element: (
          <RequireRole roles={["super_admin"]}>
            <TournamentAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "teams",
        element: (
          <RequireRole roles={["super_admin", "team_owner"]}>
            <TeamAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "players",
        element: (
          <RequireRole roles={["super_admin", "team_owner"]}>
            <PlayerAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "matches",
        element: (
          <RequireRole roles={["super_admin", "score_manager"]}>
            <MatchAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "standings",
        element: (
          <RequireRole roles={["super_admin", "score_manager", "team_owner", "content_manager", "quiz_manager"]}>
            <StandingsAdminView />
          </RequireRole>
        ),
      },
      {
        path: "live",
        element: (
          <RequireRole roles={["super_admin", "score_manager"]}>
            <LiveControlPanelPage />
          </RequireRole>
        ),
      },
      {
        path: "users",
        element: (
          <RequireRole roles={["super_admin"]}>
            <UserManagementPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: "*", element: <NotFound /> },
];

function AdminShell() {
  const canSeeMatches = useAuthStore((s) => s.user?.role === "super_admin" || s.user?.role === "score_manager");
  return (
    <div>
      <nav className="mb-4 flex gap-4 text-sm">
        <Link className="text-brand-600 underline" to="/admin/tournaments">Tournaments &amp; venues</Link>
        <Link className="text-brand-600 underline" to="/admin/teams">Teams</Link>
        <Link className="text-brand-600 underline" to="/admin/players">Players</Link>
        {canSeeMatches && <Link className="text-brand-600 underline" to="/admin/matches">Matches</Link>}
        {canSeeMatches && <Link className="text-red-600 underline" to="/admin/live">Live control</Link>}
        <Link className="text-brand-600 underline" to="/admin/standings">Standings</Link>
        <Link className="text-brand-600 underline" to="/admin/users">Users</Link>
      </nav>
      <Outlet />
    </div>
  );
}

function AdminHomeNote() {
  return (
    <div className="card">
      <h1 className="mb-2 text-xl font-bold">Admin portal</h1>
      <p className="text-sm text-slate-600">
        Modules live: Auth (9) — <Link className="underline" to="/admin/users">users</Link>;
        Tournament (1) — <Link className="underline" to="/admin/tournaments">tournaments &amp; venues</Link>.
        Team / player modules arrive next in Phase 1.
      </p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        <Link to="/" className="underline">
          Back home
        </Link>
      </p>
    </div>
  );
}

import { Link } from "react-router-dom";

import { AdminDashboardPage } from "./admin/AdminDashboardPage.js";
import { AdminShell } from "./admin/AdminShell.js";
import { ActivityLogPage } from "./admin/ActivityLogPage.js";
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
import { AboutTournamentPage } from "./public/AboutTournamentPage.js";
import { AmbassadorPage } from "./public/AmbassadorPage.js";
import { SponsorsPage } from "./public/SponsorsPage.js";
import { AccountPage } from "./public/AccountPage.js";
import { HomePage } from "./public/HomePage.js";
import { FansPage } from "./public/FansPage.js";
import { NewsAdminPage } from "./admin/news/NewsAdminPage.js";
import { MediaAdminPage } from "./admin/media/MediaAdminPage.js";
import { NewsPage } from "./public/NewsPage.js";
import { NewsDetailPage } from "./public/NewsDetailPage.js";
import { ReelsPage } from "./public/ReelsPage.js";
import { GalleryPage } from "./public/GalleryPage.js";
import { GalleryDetailPage } from "./public/GalleryDetailPage.js";
import { QuizPage } from "./public/QuizPage.js";
import { PredictPage } from "./public/PredictPage.js";
import { LeaderboardPage } from "./public/LeaderboardPage.js";
import { FanEngagementAdminPage } from "./admin/fan-engagement/FanEngagementAdminPage.js";
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
  { path: "/news/:slug", element: <NewsDetailPage /> },
  { path: "/reels", element: <ReelsPage /> },
  { path: "/gallery", element: <GalleryPage /> },
  { path: "/gallery/:id", element: <GalleryDetailPage /> },
  { path: "/quizzes", element: <QuizPage /> },
  { path: "/predict", element: <PredictPage /> },
  { path: "/leaderboard", element: <LeaderboardPage /> },
  { path: "/fans", element: <FansPage /> },
  { path: "/standings", element: <StandingsPage /> },
  { path: "/about", element: <AboutTournamentPage /> },
  { path: "/ambassador", element: <AmbassadorPage /> },
  { path: "/sponsors", element: <SponsorsPage /> },
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
      { index: true, element: <AdminDashboardPage /> },
      {
        path: "activity",
        element: (
          <RequireRole
            roles={["super_admin", "team_owner", "content_manager", "score_manager", "quiz_manager"]}
          >
            <ActivityLogPage />
          </RequireRole>
        ),
      },
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
        path: "fans",
        element: (
          <RequireRole roles={["super_admin", "quiz_manager"]}>
            <FanEngagementAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "news",
        element: (
          <RequireRole roles={["super_admin", "content_manager"]}>
            <NewsAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "media",
        element: (
          <RequireRole roles={["super_admin", "content_manager"]}>
            <MediaAdminPage />
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

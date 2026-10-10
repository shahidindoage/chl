import { Activity, FileText, Gauge, Radio, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { getDashboard, type DashboardDto } from "../api/admin.client.js";
import { apiErrorMessage } from "../api/client.js";
import { TeamCrest } from "../components/TeamCrest.js";

/** Module 10 — admin dashboard: aggregate counts + recent activity (Phase 4). */

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "slate" | "live" | "accent";
}) {
  const tones = {
    slate: "text-slate-400",
    live: "text-red-500",
    accent: "text-pitch-orange-dark",
  } as const;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <Icon className={`h-4 w-4 ${tones[tone]}`} />
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children, action }: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        {/* No font-display here: Druk turns to mush at 14px. */}
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-navy">
          <Icon className="h-4 w-4 text-slate-400" />
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((e) => setError(apiErrorMessage(e, "Could not load the dashboard")));
  }, []);

  if (error) return <p className="alert-error">{error}</p>;
  if (!dashboard) return <p className="text-slate-400">Loading dashboard…</p>;

  const { counts, content, upcomingFixtures, recentUsers, recentActivity } = dashboard;
  const quizTotal = Object.values(content.quizzes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          League overview and the latest admin activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Teams" value={counts.teams} icon={Users} />
        <StatTile label="Matches" value={counts.matches} icon={Gauge} />
        <StatTile
          label="Live now"
          value={counts.liveMatches}
          icon={Radio}
          tone={counts.liveMatches > 0 ? "live" : "slate"}
        />
        <StatTile label="Members" value={counts.users} icon={Users} tone="accent" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Completed" value={counts.completedMatches} icon={Trophy} />
        <StatTile label="Upcoming" value={counts.upcomingMatches} icon={Gauge} />
        <StatTile label="Supporters" value={counts.fans} icon={Users} />
        <StatTile label="Articles" value={content.publishedArticles} icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Next fixtures"
          icon={Gauge}
          action={
            <Link to="/admin/matches" className="text-xs font-semibold text-pitch-orange-dark hover:underline">
              All matches
            </Link>
          }
        >
          {upcomingFixtures.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming fixtures scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingFixtures.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamCrest name={m.teamA.name} shortName={m.teamA.shortName} color1={m.teamA.color1} logo={m.teamA.logo} size="sm" />
                    <span className="truncate text-xs font-semibold text-navy">
                      {m.teamA.shortName} vs {m.teamB.shortName}
                    </span>
                    <TeamCrest name={m.teamB.name} shortName={m.teamB.shortName} color1={m.teamB.color1} logo={m.teamB.logo} size="sm" />
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(m.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent activity"
          icon={Activity}
          action={
            <Link to="/admin/activity" className="text-xs font-semibold text-pitch-orange-dark hover:underline">
              Full log
            </Link>
          }
        >
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">
              No admin writes logged yet. Actions appear here as managers edit data.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivity.slice(0, 6).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold text-navy">{entry.action}</p>
                    <p className="truncate text-xs text-slate-400">{entry.userName ?? "system"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Content" icon={FileText}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Articles", content.articles],
              ["Published", content.publishedArticles],
              ["Drafts", content.drafts],
              ["Reels", content.reels],
              ["Galleries", content.galleries],
              ["Quizzes", quizTotal],
              ["Quiz attempts", content.quizAttempts],
              ["Predictions", content.predictions],
              ["Push subs", content.pushSubscriptions],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="font-display text-lg font-extrabold text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Newest members" icon={Users}>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-400">No members yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{u.name}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {u.role.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-xs text-slate-400">
        Updated {new Date(dashboard.generatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}


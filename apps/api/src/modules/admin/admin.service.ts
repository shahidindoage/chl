import type { MatchStatus } from "@prisma/client";

import { listActivityLogs } from "../activity-log/activity-log.service.js";
import { countUsers, findRecentUsers } from "../auth/auth.service.js";
import { getFanEngagementStats } from "../fan-engagement/fan-engagement.service.js";
import { countMatches, listMatches } from "../match/match.service.js";
import { countContent } from "../news/news.service.js";
import { countSubscriptions } from "../notifications/notifications.repository.js";
import { countTeams } from "../team/team.service.js";
import type { DashboardQuery } from "./admin.schema.js";

/**
 * Module 10 — admin dashboard aggregates.
 *
 * This service owns no Prisma models. It composes the *exported service
 * functions* of other modules (Section 2 rule 2): the count helpers added to
 * team/match/auth/news/fan-engagement exist precisely so this can aggregate
 * without reading their tables directly.
 */

export interface DashboardCounts {
  teams: number;
  matches: number;
  liveMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  users: number;
  fans: number;
}

export interface DashboardContentCounts {
  articles: number;
  publishedArticles: number;
  drafts: number;
  reels: number;
  galleries: number;
  quizzes: Record<string, number>;
  quizAttempts: number;
  predictions: number;
  pushSubscriptions: number;
}

export interface DashboardDto {
  counts: DashboardCounts;
  content: DashboardContentCounts;
  upcomingFixtures: Awaited<ReturnType<typeof listMatches>>["items"];
  recentUsers: Awaited<ReturnType<typeof findRecentUsers>>;
  recentActivity: Awaited<ReturnType<typeof listActivityLogs>>["items"];
  activityTotal: number;
  generatedAt: string;
}

const FANS_ROLE = "fan" as const;

export async function getDashboard(query: DashboardQuery): Promise<DashboardDto> {
  const now = new Date();

  const [
    teams,
    totalMatches,
    liveMatches,
    completedMatches,
    upcomingMatches,
    users,
    fans,
    contentStats,
    content,
    pushSubscribers,
    upcoming,
    recentUsers,
    activityPage,
  ] = await Promise.all([
    countTeams(),
    countMatches(),
    countMatches({ status: "live" satisfies MatchStatus }),
    countMatches({ status: "completed" }),
    countMatches({ status: "upcoming" }),
    countUsers(),
    countUsers({ role: FANS_ROLE }),
    getFanEngagementStats(),
    countContent(),
    countSubscriptions(),
    listMatches({ page: 1, limit: query.fixtures, status: "upcoming", from: now }),
    findRecentUsers(5),
    listActivityLogs({ page: 1, limit: query.activity }),
  ]);

  return {
    counts: {
      teams,
      matches: totalMatches,
      liveMatches,
      completedMatches,
      upcomingMatches,
      users,
      fans,
    },
    content: {
      ...content,
      quizzes: contentStats.quizzes,
      quizAttempts: contentStats.attempts,
      predictions: contentStats.predictions,
      pushSubscriptions: pushSubscribers,
    },
    // listMatches returns a pagination envelope; the dashboard only needs rows.
    upcomingFixtures: upcoming.items,
    recentUsers,
    recentActivity: activityPage.items,
    activityTotal: activityPage.total,
    generatedAt: now.toISOString(),
  };
}
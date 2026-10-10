import type { MatchDto, Role } from "@tournament/shared";

import { http } from "./client.js";

/** Module 10 — admin dashboard + activity log viewer (Section 8, Phase 4). */

export interface ActivityLogDto {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: Role | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export interface DashboardDto {
  counts: {
    teams: number;
    matches: number;
    liveMatches: number;
    completedMatches: number;
    upcomingMatches: number;
    users: number;
    fans: number;
  };
  content: {
    articles: number;
    publishedArticles: number;
    drafts: number;
    reels: number;
    galleries: number;
    quizzes: Record<string, number>;
    quizAttempts: number;
    predictions: number;
    pushSubscriptions: number;
  };
  upcomingFixtures: MatchDto[];
  recentUsers: { id: string; name: string; email: string; role: Role; createdAt: string }[];
  recentActivity: ActivityLogDto[];
  activityTotal: number;
  generatedAt: string;
}

export async function getDashboard(): Promise<DashboardDto> {
  const { data } = await http.get<{ dashboard: DashboardDto }>("/admin/dashboard");
  return data.dashboard;
}

export async function listActivity(params: {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
} = {}): Promise<{ items: ActivityLogDto[]; total: number; page: number; limit: number }> {
  const { data } = await http.get("/admin/activity", { params });
  return data;
}

export async function getActivityFacets(): Promise<{ actions: string[]; entities: string[] }> {
  const { data } = await http.get<{ actions: string[]; entities: string[] }>("/admin/activity/facets");
  return data;
}
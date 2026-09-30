import type {
  CommentaryDto,
  EndMatchControlInput,
  LiveScoreInput,
  LiveStatusDto,
  PublishCommentaryInput,
  StartMatchControlInput,
} from "@tournament/shared";

import { http } from "./client.js";

/** Module 5 — typed functions 1:1 with apps/api live routes (Section 6). */

export interface LiveFeed {
  status: LiveStatusDto;
  commentary: CommentaryDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getLiveFeed(matchId: string, params: { page?: number; limit?: number } = {}): Promise<LiveFeed> {
  const { data } = await http.get<LiveFeed>(`/live/matches/${matchId}/live`, { params });
  return data;
}

export async function startMatch(matchId: string, input: StartMatchControlInput): Promise<LiveStatusDto> {
  const { data } = await http.post<{ status: LiveStatusDto }>(`/live/matches/${matchId}/start`, input);
  return data.status;
}

export async function pauseMatch(matchId: string): Promise<LiveStatusDto> {
  const { data } = await http.post<{ status: LiveStatusDto }>(`/live/matches/${matchId}/pause`);
  return data.status;
}

export async function resumeMatch(matchId: string): Promise<LiveStatusDto> {
  const { data } = await http.post<{ status: LiveStatusDto }>(`/live/matches/${matchId}/resume`);
  return data.status;
}

export async function endMatch(matchId: string, input: EndMatchControlInput = {}): Promise<LiveStatusDto> {
  const { data } = await http.post<{ status: LiveStatusDto }>(`/live/matches/${matchId}/end`, input);
  return data.status;
}

export async function updateScore(matchId: string, input: LiveScoreInput): Promise<LiveStatusDto> {
  const { data } = await http.put<{ status: LiveStatusDto }>(`/live/matches/${matchId}/score`, input);
  return data.status;
}

export async function publishCommentary(matchId: string, input: PublishCommentaryInput): Promise<CommentaryDto> {
  const { data } = await http.post<{ commentary: CommentaryDto }>(`/live/matches/${matchId}/commentary`, input);
  return data.commentary;
}

export async function deleteCommentaryLine(commentaryId: string): Promise<void> {
  await http.delete(`/live/commentary/${commentaryId}`);
}

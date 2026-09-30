export const ROLES = [
  "super_admin",
  "team_owner",
  "content_manager",
  "score_manager",
  "quiz_manager",
  "fan",
] as const;

export type Role = (typeof ROLES)[number];

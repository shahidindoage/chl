import type { Role } from "@tournament/shared";

/**
 * Central permission map (PROJECT_MASTER_PLAN.md Section 7).
 * Defined once, before Module 1 — modules never invent permissions per endpoint.
 */
export const PERMISSIONS = {
  super_admin: ["*"],
  team_owner: ["team:edit:own", "player:manage:own"],
  content_manager: ["news:*"],
  score_manager: ["match:*", "live-score:*"],
  quiz_manager: ["fan-engagement:*"],
  fan: ["fan-engagement:participate"],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = string;

/**
 * True when `role` holds `required` — supports wildcard entries:
 * "*" grants everything, "news:*" grants any permission starting "news:".
 */
export function roleHasPermission(role: Role, required: Permission): boolean {
  const grants: readonly string[] = PERMISSIONS[role] ?? [];
  if (grants.includes("*")) return true;
  if (grants.includes(required)) return true;
  return grants.some((grant) => {
    if (!grant.endsWith(":*")) return false;
    const prefix = grant.slice(0, -1); // keep trailing colon
    return required.startsWith(prefix);
  });
}

export function roleHasAnyPermission(role: Role, required: readonly Permission[]): boolean {
  return required.length === 0 || required.some((permission) => roleHasPermission(role, permission));
}

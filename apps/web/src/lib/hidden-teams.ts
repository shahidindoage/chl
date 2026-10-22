/**
 * Teams hidden from the public standings tables.
 *
 * The points table is derived from completed matches, so a team that has been
 * removed from the tournament can still appear in the table for as long as
 * matches referencing it exist. Rather than change the derivation, this list
 * lets an editor hide specific teams from the public views without touching
 * the API or the database.
 *
 * Add a team's id (the UUID from /admin/teams) to the array below and it
 * disappears from:
 *   - the standings page table (components/StandingsTable.tsx)
 *   - the homepage points table (public/home/StandingsSection.tsx)
 *   - the admin read-only standings view (also uses StandingsTable)
 *
 * Hidden teams still count towards the matches and points of the teams they
 * played against — only their own row is suppressed.
 */
export const HIDDEN_TEAM_IDS: string[] = [
  // "Team id here",
  'b5abe576-0785-406d-9cdc-14467b469492',
  '820713fb-2b1e-4b67-b7b5-0bdebdda85db'
];

/** True when a team id is on the hide list. */
export function isTeamHidden(teamId: string): boolean {
  return HIDDEN_TEAM_IDS.includes(teamId);
}

/**
 * Drop hidden teams and renumber the positions so the "#" column stays
 * contiguous. Without the renumber, hiding the 2nd-placed team would leave
 * the table reading 1, 3, 4.
 */
export function visibleStandingsRows<T extends { teamId: string; position: number }>(
  rows: readonly T[]
): T[] {
  return rows
    .filter((row) => !isTeamHidden(row.teamId))
    .map((row, index) => ({ ...row, position: index + 1 }));
}

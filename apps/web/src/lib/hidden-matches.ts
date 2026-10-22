/**
 * Matches hidden from the public fixtures.
 *
 * The homepage "Next Matches" preview and the full-schedule modal are driven
 * by whatever the schedule says is next. This list lets an editor pull a
 * specific fixture out of those views without touching the API, the database
 * or the fixture's actual status — the match still exists and still counts
 * towards standings and predictions.
 *
 * The list applies to the SCHEDULE only. Once a fixture is live or has been
 * played it is always shown again:
 *   - a hidden match that goes live still appears in the "Live Now" strip and
 *     the Live Match Center, because omitting a match in progress reads as
 *     a cancelled fixture
 *   - a hidden match that finishes still shows its result
 *
 * Add a match id (the UUID from /admin/matches) to the array below and it is
 * hidden from:
 *   - the homepage "Next Matches" section
 *   - the "All Matches" and search modals
 *   - the upcoming fixtures list on the public fixtures page (/matches)
 *
 * Hidden matches are NOT removed from the prediction or fan-engagement
 * screens: a supporter must still be able to predict on a fixture that is
 * merely hidden from the marketing surfaces.
 */
export const HIDDEN_MATCH_IDS: string[] = [
  // "Match id here",

  '095b5af3-1573-445b-8637-de58acb426f1'
];

/** True when a match id is on the hide list. */
export function isMatchHidden(matchId: string): boolean {
  return HIDDEN_MATCH_IDS.includes(matchId);
}

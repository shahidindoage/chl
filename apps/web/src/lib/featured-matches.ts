/**
 * Homepage curated-matches section.
 *
 * Unlike "Next Matches", which shows whatever the schedule says is next, this
 * section is hand-picked: you list the match ids and only those fixtures are
 * shown, in the order you list them.
 *
 * To use it:
 *  1. Copy a match id from /admin/matches (or the API's /matches response).
 *  2. Paste it into matchIds below.
 *  3. Edit the heading and subtitle to suit the fixtures you picked.
 *
 * The section hides itself entirely while matchIds is empty, so nothing shows
 * on the homepage until you choose the matches.
 */

export const FEATURED_MATCHES_SECTION = {
  /** Small label above the heading, shown in the same style as every other section. */
 eyebrow: "Women's Exhibition Match",
heading: "Featured Match",
subtitle: "Top women's teams face off on the turf.",
  /**
   * Match ids to show, in the order they should appear. Empty means the
   * section is hidden.
   */
  matchIds: [
    "095b5af3-1573-445b-8637-de58acb426f1",
  ] as string[],
} as const; 

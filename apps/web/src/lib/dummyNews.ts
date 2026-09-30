/**
 * Placeholder news content for the homepage Latest News section and the
 * /news page.
 *
 * News is Module 7 and has no backend yet, so these are sample articles that
 * exist only to show the layouts. They are not real reporting and are replaced
 * by API data once the news module lands.
 */

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  readTime: string;
}

/** Used when a remote thumbnail fails to load. */
const FALLBACK_IMAGE =
  "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey/hero.png";

export const NEWS_FALLBACK_IMAGE = FALLBACK_IMAGE;

/** Every category present in the sample set, for grouping or filtering later. */
export const NEWS_CATEGORIES = [
  "Match Report",
  "Preview",
  "League Update",
  "Spotlight",
  "Interview",
  "Tournament",
] as const;

export const DUMMY_NEWS: NewsItem[] = [
  {
    id: "news-1",
    date: "2026-09-28",
    title: "Winter Cup Kicks Off With a Clinical Opening Set",
    summary:
      "Winter Kings opened their title defence with a 3-1 win at the Raipur arena, controlling possession from the first quarter to the final whistle.",
    content:
      "Winter Kings arrived at the Raipur arena under a banner of expectation and left with the opening fixture comfortably won. An early penalty-corner conversion settled the tie, and a disciplined defensive structure kept Ice Breakers scoreless through the opening period.\n\nThe visitors responded after the break with a sharp counter-attack that narrowed the margin, but the home side's midfield control never wavered. A third goal late in the final quarter put the result beyond doubt and handed the Kings a clean sheet to build on.\n\nBoth sides return to the pitch this weekend, with attention already turning to the second round of fixtures.",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    category: "Match Report",
    readTime: "3 min read",
  },
  {
    id: "news-2",
    date: "2026-09-26",
    title: "Storm Riders Eye Top Spot After Durg Derby Win",
    summary:
      "A brace inside the final ten minutes overturned a one-goal deficit against Ice Breakers and pushed Storm Riders level on points at the summit.",
    content:
      "Storm Riders produced the comeback of the round, scoring twice in the closing minutes to overturn a deficit that had stood for most of the match.\n\nTrailing by a single goal, they pushed fullbacks forward and reshaped the midfield. The first equaliser arrived from a well-worked set piece; the winner followed moments later when a defensive slip was punished with clinical finishing.\n\nThe result leaves the Riders level on points with the leaders, with the head-to-head schedule ahead likely to prove decisive in the final standings.",
    imageUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80",
    category: "Preview",
    readTime: "4 min read",
  },
  {
    id: "news-3",
    date: "2026-09-24",
    title: "League Confirms Expanded Schedule Across Three Venues",
    summary:
      "Fixture congestion forced a schedule revision, adding a midweek round and opening a third venue in Ambikapur to keep the competition on track.",
    content:
      "Organisers confirmed a revised fixture list after an initial congestion review. A midweek round has been added, and a third venue in Ambikapur will host fixtures from the fourth round onward.\n\nThe change keeps every registered team to a balanced number of home and away fixtures while avoiding three-match weeks. Ambikapur's synthetic surface has passed inspection and is available for league use from next month.\n\nUpdated dates are available from the fixtures page, and clubs have been notified directly of any kickoff time changes.",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    category: "League Update",
    readTime: "2 min read",
  },
  {
    id: "news-4",
    date: "2026-09-22",
    title: "Goalkeeper Earns Player of the Round After Record Saves",
    summary:
      "A standout defensive performance drew praise from both benches, with the numbers underlining one of the finest individual displays of the season so far.",
    content:
      "The numbers tell the story: a double-figure save count, a clean sheet, and repeated last-done-defended situations closed off with positioning that never wavered.\n\nCoaches on both sides singled out the performance afterwards, with one describing the display as the difference in a fixture that stayed level for long stretches.\n\nPlayer of the Round voting is open to supporters through the end of the week, with the shortlist also including the two strikers behind the weekend's highest-scoring match.",
    imageUrl: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=800&q=80",
    category: "Spotlight",
    readTime: "3 min read",
  },
  {
    id: "news-5",
    date: "2026-09-20",
    title: "Storm Riders Rebuild Midfield Around a Quieter Passing Game",
    summary:
      "A shift away from direct running has made the Riders harder to press and far more patient in possession, and the results have followed.",
    content:
      "Two matches into the revised schedule, Storm Riders' midfield has settled into a noticeably slower rhythm — and a considerably more effective one.\n\nRather than looking for the vertical ball, the midfield now circulates until a flank opens, accepting an extra pass in exchange for a cleaner final third. The change has reduced turnovers in dangerous areas and given the forwards a settled platform.\n\nIt is a less glamorous way to win, but the league's only unbeaten side has collected the most points over the same span.",
    imageUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80",
    category: "Interview",
    readTime: "4 min read",
  },
  {
    id: "news-6",
    date: "2026-09-18",
    title: "Ice Breakers Hand Out Young Player Contracts Before Window Closes",
    summary:
      "Three academy graduates have signed their first senior terms, rewarding a development pathway that produced most of the current squad.",
    content:
      "Ice Breakers have tied down three academy graduates ahead of the registration window closing, completing a squad in which the majority of players came through the club's own programme.\n\nAll three featured heavily last season and were rewarded with multi-year deals. The club's director of football described the decision as a long-term statement about pathway work over short-term recruitment.\n\nThe club will add a fourth goalkeeper to the academy intake at the start of the pre-season.",
    imageUrl: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&q=80",
    category: "League Update",
    readTime: "3 min read",
  },
  {
    id: "news-7",
    date: "2026-09-16",
    title: "Neutral Venue Trial Draws Strong Turnout for Double-Header Round",
    summary:
      "A packed ground and two tight matches made a convincing case for rotating fixtures away from the usual home venues.",
    content:
      "Organisers trialled a neutral venue for a double-header round, and the numbers suggest the idea is worth keeping.\n\nA full house watched both fixtures, with neither side able to claim home advantage in the way a familiar ground usually allows. The closest contest of the season to date came from the same bill.\n\nA decision on extending the arrangement beyond this round is expected before the next fixtures are published.",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    category: "Tournament",
    readTime: "3 min read",
  },
  {
    id: "news-8",
    date: "2026-09-14",
    title: "Winter Kings Name Teenager as Youngest-Ever League Debutant",
    summary:
      "A 16-year-old academy midfielder came on in the closing stages and immediately changed the shape of the contest.",
    content:
      "Winter Kings have handed a debut to a 16-year-old midfielder, making them the youngest player to feature in the competition.\n\nIntroduced with twenty minutes remaining and a level scoreline, the teenager steadied a congested midfield and set up the winner four minutes later — the first senior goal of their career.\n\nThe club have been careful to manage the workload, and the player will return to academy football for the next two fixtures before returning to senior duty.",
    imageUrl: "https://images.unsplash.com/photo-1518600506278-4e8ef466b810?auto=format&fit=crop&w=800&q=80",
    category: "Spotlight",
    readTime: "2 min read",
  },
  {
    id: "news-9",
    date: "2026-09-12",
    title: "Captain Reflects on a Defeat That Cost the Title Race Little",
    summary:
      "Still unbeaten in the league but beaten in the cup, the Kings' captain was candid about the trade-off between the two competitions.",
    content:
      "Winter Kings remain unbeaten in the league but exited a cup tie on penalties, and their captain was refreshingly direct about the trade-off.\n\nThe rotation used to manage the fixture pile-up in mid-season had already been decided, and the first-choice side did not start. Whether that was the right call is a question the captain declined to answer in detail.\n\nLeague position is unchanged, and the cup run is over. The league resumes this weekend with the same squad that started the cup tie.",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    category: "Interview",
    readTime: "4 min read",
  },
];

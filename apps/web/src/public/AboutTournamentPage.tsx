import { PageHero } from "../components/PageHero.js";

/** Public FE: about the tournament (static content for now). */

const sections = [
  {
    title: "What the league is",
    body: [
      "The Chhattisgarh Hockey League is the state's premier club hockey competition, bringing together franchises from Raipur, Bhilai, Bilaspur, Durg, Korba and Jagdalpur under a single points table.",
      "Founded on the belief that the game here deserves the same professional structure as the national circuit, the league runs a full season of league fixtures followed by a playoff series, with every match streamed and covered.",
    ],
  },
  {
    title: "How the season works",
    body: [
      "Clubs play every other side home and away. A win is worth three points and a draw one, with goal difference separating clubs level on points.",
      "The top four sides at the end of the league stage qualify for the playoffs. Semi-finals are played over a single match, with the final hosted at a neutral venue decided by the league committee.",
    ],
  },
  {
    title: "Standards and development",
    body: [
      "The league runs a year-round development programme across the state, with accredited coaches working with school and district-level age groups. Talent identification begins in the under-12 and under-16 categories.",
      "Clubs are required to field a minimum number of under-23 players in every match, giving young players competition experience rather than bench time.",
    ],
  },
];

export function AboutTournamentPage() {
  return (
    <div>
      <PageHero
        title="About the Tournament"
        description="The Chhattisgarh Hockey League — the state's premier club hockey competition."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "About" }]}
      />

      <div className="mx-auto max-w-7xl">
      

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl font-extrabold text-navy">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 32)} className="mt-3 text-sm leading-relaxed text-slate-600">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

      
      </div>
    </div>
  );
}
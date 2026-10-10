import { PageHero } from "../components/PageHero.js";

/** Public FE: tournament ambassador programme (static content for now). */

/**
 * Placeholder portrait — swap `image` for the ambassador's own photograph
 * before launch.
 */
const ambassador = {
  name: "Sardara Singh",
  role: "Brand Ambassador",
  line: "Former Captain, Indian Men's Hockey Team",
  initials: "SS",
  image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Indian_hockey_team_captain_saradara_singh_with_other_players_at_kalinga_stadium_%28cropped%29.jpg/500px-Indian_hockey_team_captain_saradara_singh_with_other_players_at_kalinga_stadium_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  intro:
    "A legendary former captain and midfielder of the Indian men's field hockey team, and one of the most decorated players of his generation.",
  highlights: [
    "Youngest Captain — took charge of the Indian side at 21 during the 2008 Sultan Azlan Shah Cup.",
    "Tenure — captained India for eight years, playing 314 international matches across a 12-year career.",
    "Awards — Arjuna Award (2012), Padma Shri (2015) and the Rajiv Gandhi Khel Ratna.",
    "Retirement — announced his exit from international hockey in September 2018.",
  ],
  postRetirement: [
    "Moved into coaching and mentoring, working with sides such as the Soorma Hockey Club in the Hockey India League.",
    "Coached the India U-18 men's team, helping shape the next generation of players.",
  ],
  stats: [
    { label: "Internationals", value: "314" },
    { label: "Years as captain", value: "8" },
    { label: "Youngest captain", value: "21" },
  ],
  tags: ["Arjuna Award", "Padma Shri", "Rajiv Gandhi Khel Ratna"],
};

const benefits = [
  {
    title: "Be the voice of the game",
    body: "Represent the league at fixtures, community events and through the season's media.",
  },
  {
    title: "Grow the grassroots",
    body: "Work directly with the development programme and help identify the next generation of players.",
  },
  {
    title: "Shape the competition",
    body: "Ambassadors sit on the outreach committee, feeding supporter feedback back to the league committee.",
  },
];

export function AmbassadorPage() {
  return (
    <div>
      <PageHero
        title="Tournament Ambassador"
        description="The face of the Chhattisgarh Hockey League, on and off the pitch."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Ambassador" }]}
      />

      <div className="mx-auto max-w-7xl">
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-extrabold text-navy">{b.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{b.body}</p>
            </div>
          ))}
        </section>

        {/* Feature card — portrait left, content right. */}
        <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="grid gap-0 md:grid-cols-5">
            <div className="relative h-64 w-full overflow-hidden md:col-span-2 md:h-full">
              <img
                src={ambassador.image}
                alt={`${ambassador.name}, ${ambassador.role}`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 md:col-span-3 md:py-10">
              <p className="text-xs font-bold uppercase tracking-widest text-pitch-orange-dark">
                {ambassador.role}
              </p>
              <h3 className="mt-1 font-display text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
                {ambassador.name}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                </svg>
                {ambassador.line}
              </p>

              <div className="my-5 h-px w-16 bg-pitch-orange" />

              <p className="text-sm leading-relaxed text-slate-600">{ambassador.intro}</p>

              <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-navy">
                Career highlights
              </h4>
              <ul className="mt-3 space-y-2">
                {ambassador.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pitch-orange" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>

              <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-navy">
                Post-retirement
              </h4>
              <ul className="mt-3 space-y-2">
                {ambassador.postRetirement.map((h) => (
                  <li key={h} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pitch-orange" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>

              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                {ambassador.stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-400">{s.label}</dt>
                    <dd className="font-display text-2xl font-extrabold text-navy">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {ambassador.tags.map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
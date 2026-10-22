import { PageHero } from "../components/PageHero.js";
import { useSeo } from "../hooks/useSeo.js";

/**
 * Public FE: about the tournament.
 *
 * Copy is transcribed from about.txt at the repo root — real, sourced content
 * replacing the earlier placeholder text.
 */

const intro =
  "Six franchise teams come together at Raipur's SVP International Hockey Stadium from 21 October to 1 November 2026. Entry is free, and every match streams live on JioHotstar.";

const sections = [
  {
    title: "What CHL is",
    body: [
      "The Chhattisgarh Hockey League (CHL) is the state's own franchise hockey league, sanctioned by Hockey India. Six teams, each representing a region of Chhattisgarh, play for the CHL title over 12 days in Raipur.",
      "Most players in each squad come from Chhattisgarh, and each team adds a few national and international players. The idea is to give hockey players from this state a professional league at home, in front of their own crowd.",
    ],
  },
  {
    title: "How it started",
    body: [
      "CHL is an initiative of the Department of Sports and Youth Welfare, Chhattisgarh, in association with the Government of Chhattisgarh. Hockey India, the national body for the sport, has sanctioned the league.",
      "Deputy Chief Minister Arun Sao launched the league in Raipur on 26 August 2026. At the launch, the league announced its dates, its six franchises, its mascot Baghwa and its tagline.",
      "Player trials were held at SVP Stadium on 28 and 29 September 2026, ahead of the player draft.",
    ],
  },
  {
    title: "Our home ground",
    body: [
      "Every CHL match is played at Sardar Vallabhbhai Patel International Hockey Stadium on G.E. Road, Raipur. The ground has hosted top-level hockey before.",
      "In 2015 it staged the men's Hockey World League Final, the first international hockey tournament held in Raipur, and India won bronze there.",
    ],
  },
];

const teams = [
  { name: "Rajdhani Royals", home: "Raipur" },
  { name: "Nyayadhani Knights", home: "Bilaspur" },
  { name: "Sanskardhani Strikers", home: "Rajnandgaon" },
  { name: "Chakradhar Champions", home: "Raigarh" },
  { name: "Bailadila Bulls", home: "Bailadila Hills" },
  { name: "Mainpat Titans", home: "Surguja" },
];

const howItWorks = [
  "Each team has 22 players: 18 from Chhattisgarh and 4 from outside the state.",
  "Every team plays every other team once, which makes 15 league matches.",
  "The top four teams reach the semi-finals. 1st plays 4th, and 2nd plays 3rd.",
  "The Final is on 1 November 2026.",
  "Every match is at SVP International Hockey Stadium, Raipur, and entry is free.",
  "Every match streams live on JioHotstar.",
];

const backers = [
  {
    label: "Sanctioned by",
    value: "Hockey India",
    img: "https://chhattisgarhhockeyleague.com/uploads/Hockey_India-684807b5f95e2e52.webp",
  },
  {
    label: "An initiative of",
    value: "Department of Sports and Youth Welfare, Chhattisgarh",
    img: "https://chhattisgarhhockeyleague.com/uploads/imgi_3_headerlogo2-aa95653e9290615f.png",
  },
  {
    label: "Broadcast partner",
    value: "JioHotstar",
    img: "https://chhattisgarhhockeyleague.com/uploads/imgi_8_jiohotstar-d63c78709f62ca8b.webp",
  },
];

export function AboutTournamentPage() {
  useSeo();
  return (
    <div>
      <PageHero
        title=""
        description=""
        breadcrumb={[{ label: "Home", to: "/" }, { label: "About" }]}
        image="https://chhattisgarhhockeyleague.com/uploads/imgi_4_about_desktop_banner-6acae2a0a1449782.png"
        imageMobile="https://chhattisgarhhockeyleague.com/uploads/imgi_5_about_mobile_banner-3b12574ce6a040be.png"
      />  

      <div className="mx-auto max-w-7xl">
        <p className="mt-10 font-display text-xl font-extrabold leading-snug text-navy sm:text-2xl">
          About the Chhattisgarh Hockey League
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{intro}</p>

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

        {/* Mascot */}
        <section className="mt-12 rounded-2xl bg-navy px-6 py-8 sm:px-8">
          <h2 className="font-display text-2xl font-extrabold text-white">Meet Baghwa</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Baghwa (बघवा) is the CHL mascot. His name is how people here say bagh, the tiger.
            Baghwa comes from a Chhattisgarh forest and has a Chhattisgarhi name. That is what he
            stands for: CHL is Chhattisgarh&apos;s league, played by Chhattisgarh&apos;s players.
            He also brings the league&apos;s call to every fan in the state:
          </p>
          <p lang="hi" className="mt-5 font-display text-xl font-extrabold text-pitch-orange sm:text-2xl">
            चलौ रे संगी, हॉकी खेलबों
          </p>
          <p className="mt-2 text-sm italic text-white/70">Come on, friends, let&apos;s play hockey.</p>
        </section>

        {/* Teams */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold text-navy">The six teams</h2>
          <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {teams.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-display text-base font-extrabold text-navy">{t.name}</span>
                <span className="text-sm text-slate-500">{t.home}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How the league works */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold text-navy">How the league works</h2>
          <ul className="mt-4 space-y-2.5">
            {howItWorks.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pitch-orange" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        {/* Backers */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-extrabold text-navy">Who&apos;s behind CHL</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {backers.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
              >
                {b.img && (
                  <img
                    src={b.img}
                    alt={b.value}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg object-contain"
                  />
                )}
                <div className="min-w-0">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{b.label}</dt>
                  <dd className="mt-1 font-display text-base font-extrabold text-navy">{b.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

      
      </div>
    </div>
  );
}
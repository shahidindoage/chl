/**
 * Homepage sponsor strip, directly below the hero.
 *
 * Logos are hot-linked from each brand's own public asset so there is nothing
 * to host. A missing logo falls back to the sponsor's initials rather than
 * leaving a broken image, so an unavailable CDN never leaves a gap.
 */

interface Sponsor {
  name: string;
  tier: string;
  logo: string;
}

export const HOME_SPONSORS: Sponsor[] = [
  {
    name: "NTPC",
    tier: "Title Partner",
    logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/National_Thermal_Power_logo.svg/500px-National_Thermal_Power_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  },
  {
    name: "Adani",
    tier: "Powered By",
    logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Adani_logo_2012.svg/500px-Adani_logo_2012.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  },
  {
    name: "BALCO",
    tier: "Powered By",
    logo: "https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Bharat_Aluminium_Company.svg/500px-Bharat_Aluminium_Company.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  },
  {
    name: "SBI",
    tier: "Banking Partner",
    // The bank's own CDN 404s on hot-link, so this falls back to initials.
    logo: "https://sbi.bank.in/o/SBI-Theme/images/custom/logo.png",
  },

];

export function HomeSponsorsStrip() {
  return (
    <section className="relative w-full border-b border-slate-200">
      <div className="w-full px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <ul className="flex flex-wrap items-stretch gap-4 lg:gap-6">
          {HOME_SPONSORS.map((s) => (
            <li
              key={s.name}
              className="flex min-w-[9rem] flex-1 basis-40 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              {s.logo ? (
                <img
                  src={s.logo}
                  alt={`${s.name} logo`}
                  loading="lazy"
                  className="h-12 w-full max-w-[9rem] object-contain"
                  onError={(e) => {
                    // Swap in initials if the remote asset is unavailable.
                    const el = e.currentTarget;
                    el.style.display = "none";
                    el.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              {/* Fallback, revealed only if the image fails to load. */}
              <span
                className={`font-display text-2xl font-extrabold text-navy ${s.logo ? "hidden" : ""}`}
              >
                {s.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{s.tier}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
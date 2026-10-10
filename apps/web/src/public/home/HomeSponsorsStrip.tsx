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
  // Group by tier so sponsors sharing a label sit under one heading rather
  // than repeating "Partner" on every row.
  const tiers = [...new Set(HOME_SPONSORS.map((s) => s.tier))];

  return (
    <section className="relative w-full bg-pitch-pitch">
      <div className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:gap-8">
          {tiers.map((tier) => (
            <section key={tier}>
              <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">
                {tier}
              </h2>

              {/* Logos for this tier, laid out horizontally. Flex with equal flex-basis so
                  the tiles share the row evenly and centre their logo. */}
<ul className="mt-4 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
                {HOME_SPONSORS.filter((s) => s.tier === tier).map((s) => (
                  <li
                    key={s.name}
                    className="flex min-w-[8rem] max-w-[13rem] flex-1 basis-40 items-center justify-center rounded-xl px-3 py-4 transition-colors duration-200 "
                  >
                    {/* Full-width text-centred wrapper is the reliable way to
                        centre an image whose intrinsic width varies. */}
                    <span className="w-fit text-center">
                      {s.logo ? (
                        <img
                          src={s.logo}
                          alt={`${s.name} logo`}
                          loading="lazy"
                          title={s.name}
                          /* brightness-0 + invert forces every logo to pure white
                             so the marks read as one set on the dark green. */
                          className="inline-block h-12 max-w-full object-contain brightness-0 invert"
                          onError={(e) => {
                            // Swap in initials if the remote asset is unavailable.
                            const el = e.currentTarget;
                            el.style.display = "none";
                            el.parentElement
                              ?.querySelector("[data-fallback]")
                              ?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      {/* Fallback, revealed only if the image fails to load. */}
                      <span
                        data-fallback
                        className={`font-display text-xl font-extrabold text-white ${s.logo ? "hidden" : ""}`}
                      >
                        {s.name}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
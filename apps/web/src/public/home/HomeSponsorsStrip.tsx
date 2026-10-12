import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { SPONSORS, TIER_LABEL, TIER_ORDER } from "../../lib/sponsors.js";

/**
 * Homepage sponsor strip, directly below the hero.
 *
 * Shares src/lib/sponsors.ts with the /sponsors page, so both show the same
 * logos in the same tiers. Logos are hot-linked from each brand's own public
 * asset; a missing one falls back to the sponsor's name rather than leaving a
 * broken image.
 */
export function HomeSponsorsStrip() {
  return (
    <section className="relative w-full ">
      <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:gap-12">
          {/* Heading block, matching the other homepage sections. */}
          <div>
            <SectionEyebrow label="Our Partners" id="sponsors-eyebrow" />
            <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">
              League Sponsors
            </h2>
           
          </div>

          {TIER_ORDER.map((tier) => {
            const group = SPONSORS.filter((s) => s.tier === tier);
            if (group.length === 0) return null;
            return (
              <section key={tier}>
                <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  {TIER_LABEL[tier]}
                </h2>

                <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
                  {group.map((s) => (
                    <div
                      key={s.name}
                      className="flex min-w-[8rem] max-w-[13rem] flex-1 basis-40 items-center justify-center rounded-xl p-4"
                    >
                      <span className="w-full text-center">
                        <img
                          src={s.logo}
                          alt={`${s.name} logo`}
                          title={s.name}
                          loading="lazy"
                          className="inline-block h-20 max-w-full object-contain"
                          onError={(e) => {
                            // Fall back to the name if the remote asset fails.
                            const el = e.currentTarget;
                            el.style.display = "none";
                            el.parentElement
                              ?.querySelector("[data-fallback]")
                              ?.classList.remove("hidden");
                          }}
                        />
                        <span
                          data-fallback
                          className="hidden font-display text-xl font-extrabold text-navy"
                        >
                          {s.name}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
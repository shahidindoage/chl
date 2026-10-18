import { PageHero } from "../components/PageHero.js";
import { SPONSORS, TIER_LABEL, TIER_ORDER } from "../lib/sponsors.js";
import { useSeo } from "../hooks/useSeo.js";

/** Public FE: sponsors page. Data lives in src/lib/sponsors.ts, shared with
 *  the homepage strip so the two cannot drift apart. */

export function SponsorsPage() {
  useSeo();
  return (
    <div>
      <PageHero
        image="https://chhattisgarhhockeyleague.com/uploads/imgi_4_Watercolor%20Stadium%20Banner%20with%20Tricolour%20Strokes.jpg-e391ee62ac569fad.jpg"
        title="Sponsors"
        description="The organisations that make the Chhattisgarh Hockey League possible."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Sponsors" }]}
      />

      <div className="mx-auto max-w-7xl">
        {TIER_ORDER.map((tier) => {
          const group = SPONSORS.filter((s) => s.tier === tier);
          if (group.length === 0) return null;
          return (
            <section key={tier} className="mt-10">
              <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                {TIER_LABEL[tier]}
              </h2>

              {/* Flex with a capped basis so every tier centres cleanly,
                  including tiers holding a single sponsor. */}
              <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
                {group.map((s) => (
                  <div
                    key={s.name}
                    className="flex min-w-[8rem] max-w-[13rem] flex-1 basis-40 items-center justify-center rounded-xl p-4"
                  >
                    <img
                      src={s.logo}
                      alt={`${s.name} logo`}
                      title={s.name}
                      className="h-20 max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
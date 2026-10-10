import { PageHero } from "../components/PageHero.js";

/** Public FE: sponsors page (static content for now). */

/**
 * Placeholder logo images. These are generic stock brand marks standing in for
 * real sponsor artwork — swap `logo` for the client's own asset before launch.
 * They are referenced remotely, so the site needs no logo files in /public.
 */
const TIER_LABEL: Record<string, string> = {
  Title: "Title Partner",
  Official: "Powered By",
  Partner: "Banking Partner",
};

const sponsors = [
  { name: "NTPC", tier: "Title", logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/National_Thermal_Power_logo.svg/500px-National_Thermal_Power_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" },
  { name: "Adani", tier: "Official", logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Adani_logo_2012.svg/500px-Adani_logo_2012.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" },
  { name: "Balco", tier: "Official", logo: "https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Bharat_Aluminium_Company.svg/500px-Bharat_Aluminium_Company.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" },
  { name: "SBI", tier: "Partner", logo: "https://sbi.bank.in/o/SBI-Theme/images/custom/logo.png" },
]

const tiers = ["Title", "Official", "Partner"];

export function SponsorsPage() {
  return (
    <div>
      <PageHero
        title="Sponsors"
        description="The organisations that make the Chhattisgarh Hockey League possible."
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Sponsors" }]}
      />

      <div className="mx-auto max-w-7xl">
        {tiers.map((tier) => {
          const group = sponsors.filter((s) => s.tier === tier);
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
                    className="flex min-w-[8rem] max-w-[13rem] flex-1 basis-40 items-center justify-center rounded-xl  p-4 "
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
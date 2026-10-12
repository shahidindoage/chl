/**
 * Shared sponsor data, used by the homepage strip and the /sponsors page so
 * the two can't drift apart. Logos are hot-linked from each brand's own public
 * asset; swap a `logo` here and both surfaces update.
 */

export interface Sponsor {
  name: string;
  /** Internal tier key; the display label comes from TIER_LABEL. */
  tier: "Title" | "Official" | "Broadcast" | "Partner";
  logo: string;
}

export const TIER_LABEL: Record<Sponsor["tier"], string> = {
  Title: "Title Partner",
  Official: "Powered By",
  Broadcast: "Broadcasting Partner",
  Partner: "Banking Partner",
};

/** Display order — richest relationship first. */
export const TIER_ORDER: Sponsor["tier"][] = ["Title", "Official", "Broadcast", "Partner"];

export const SPONSORS: Sponsor[] = [
  {
    name: "NTPC",
    tier: "Title",
    logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/National_Thermal_Power_logo.svg/500px-National_Thermal_Power_logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  },
  {
    name: "Adani",
    tier: "Official",
    logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Adani_logo_2012.svg/500px-Adani_logo_2012.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  },
  {
    name: "Balco",
    tier: "Official",
    logo: "https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Bharat_Aluminium_Company.svg/500px-Bharat_Aluminium_Company.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
  },
  {
    name: "JioHotstar",
    tier: "Broadcast",
    logo: "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey/logos/jiohotstar.webp",
  },
  {
    name: "SBI",
    tier: "Partner",
    logo: "https://sbi.bank.in/o/SBI-Theme/images/custom/logo.png",
  },
];
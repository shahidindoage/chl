/**
 * League brand assets. These are the image URLs used by the homepage
 * design reference so the rebuilt homepage matches it pixel for pixel.
 */

const SUPABASE = "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey";

export const LEAGUE_ASSETS = {
  logo: `${SUPABASE}/hockeylogo-rm.png`,
  /** Secondary mark, shown at the far right of the header. */
  headerLogo2: `${SUPABASE}/logos/headerlogo2.png`,
  patch: `${SUPABASE}/patchnew2.png`,
  heroBanner: `${SUPABASE}/hockey%20banner.jpg%20(2).jpeg`,
  standingBanner: `${SUPABASE}/stand.png`,
  ctaBanner: "/banner.png",
  /** Looping background for the mid-page CTA banner. */
  ctaVideo: `${SUPABASE}/HomeHeros/cta.mp4`,
  /** PageHero artwork for the ambassador page. */
  ambassadorHero: `${SUPABASE}/Indian%20Hockey%20Player%20in%20Motion.png`,
} as const;

/**
 * Homepage hero slides, cross-faded automatically.
 *
 * Source of truth is hero.txt at the repo root — separate art for desktop and
 * mobile, because a single wide banner crops badly on a phone. Kept in sync
 * manually; the arrays are asserted to be the same length at runtime so a
 * slide index never falls through to the wrong image.
 */
const HERO_BASE = `${SUPABASE}/HomeHeros`;

export const HERO_SLIDES_DESKTOP = [
  `${HERO_BASE}/Hero_banner_1_desktop.png`,
  `${HERO_BASE}/Hero_banner_2_desktop.png`,
  `${HERO_BASE}/Hero_banner_3_desktop.png`,
] as const;

export const HERO_SLIDES_MOBILE = [
  `${HERO_BASE}/Hero_banner_1_mobile.png`,
  `${HERO_BASE}/Hero_banner_2_mobile.png`,
  `${HERO_BASE}/Hero_banner_3_mobile.png`,
] as const;

/** Fallback headline when no tournament is active yet. */
export const LEAGUE_FALLBACK_NAME = "Chhattisgarh Hockey League";

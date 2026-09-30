/**
 * League brand assets. These are the image URLs used by the homepage
 * design reference so the rebuilt homepage matches it pixel for pixel.
 */

const SUPABASE = "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey";

export const LEAGUE_ASSETS = {
  logo: `${SUPABASE}/hockeylogo-rm.png`,
  patch: `${SUPABASE}/patchnew2.png`,
  heroBanner: `${SUPABASE}/hero.png`,
  standingBanner: `${SUPABASE}/stand.png`,
  ctaBanner: "/banner.png",
} as const;

/** Fallback headline when no tournament is active yet. */
export const LEAGUE_FALLBACK_NAME = "Chhattisgarh Hockey League";

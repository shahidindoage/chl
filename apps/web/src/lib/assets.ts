/**
 * League brand assets. These are the image URLs used by the homepage
 * design reference so the rebuilt homepage matches it pixel for pixel.
 */

const SUPABASE = "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey";

export const LEAGUE_ASSETS = {
  logo: `${SUPABASE}/hockeylogo-rm.png`,
  patch: `${SUPABASE}/patchnew2.png`,
  heroBanner: `${SUPABASE}/hockey%20banner.jpg%20(2).jpeg`,
  standingBanner: `${SUPABASE}/stand.png`,
  ctaBanner: "/banner.png",
  /** Looping background for the mid-page CTA banner. */
  ctaVideo: `${SUPABASE}/hailuo-2_3_create_a_video-0.mp4`,
  /** PageHero artwork for the ambassador page. */
  ambassadorHero: `${SUPABASE}/Indian%20Hockey%20Player%20in%20Motion.png`,
} as const;

/**
 * Homepage hero slides, cross-faded automatically. Keep these distinct — the
 * slider stacks them, so a repeated URL just fades to an identical frame.
 */
export const HERO_SLIDES = [
  LEAGUE_ASSETS.heroBanner,
  LEAGUE_ASSETS.standingBanner,
  LEAGUE_ASSETS.ctaBanner,
] as const;

/** Fallback headline when no tournament is active yet. */
export const LEAGUE_FALLBACK_NAME = "Chhattisgarh Hockey League";

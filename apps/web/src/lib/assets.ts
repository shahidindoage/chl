/**
 * League brand assets. These are the image URLs used by the homepage
 * design reference so the rebuilt homepage matches it pixel for pixel.
 */

// const SUPABASE = "https://vrfacwizigigcpowkrye.supabase.co/storage/v1/object/public/hockey";

// const HERO_BASE_DESKTOP = `${SUPABASE}/HomeHeros`;

export const LEAGUE_ASSETS = {  
  logo: `https://chhattisgarhhockeyleague.com/uploads/imgi_2_hockeylogo-rm-f581fc9a0a5e8e38.png`,
  /** Secondary mark, shown at the far right of the header. */
  headerLogo2: `https://chhattisgarhhockeyleague.com/uploads/imgi_3_headerlogo2-aa95653e9290615f.png`,
  patch: `https://chhattisgarhhockeyleague.com/uploads/imgi_1_patchnew2-2f552ccae061f345.png`, 
  heroBanner: `https://chhattisgarhhockeyleague.com/uploads/hockey%20banner.jpg%20(2)%20(2)-adc69099abde05dc.jpg`,  
  standingBanner: `https://chhattisgarhhockeyleague.com/uploads/imgi_4_stand-56c04876e5b3bc02.png`,
  /** Standings section art on the homepage, split by breakpoint. */
  standingsDesktop: `https://chhattisgarhhockeyleague.com/uploads/point-1218bde4882a6f37.png`,
  standingsMobile: `https://chhattisgarhhockeyleague.com/uploads/pointMOBILE-8eb125fbf11da93f.png`,
  ctaBanner: "/banner.png",   
  /** Looping background for the mid-page CTA banner. */
  ctaVideo: `https://chhattisgarhhockeyleague.com/uploads/cta-0c69e5d224723c3d.mp4`,
  /** PageHero artwork for the ambassador page. */
  ambassadorHero: `https://chhattisgarhhockeyleague.com/uploads/league-f4fb16390d03c8ab.png`,
} as const;  

/**
 * Homepage hero slides, cross-faded automatically.
 *
 * Source of truth is hero.txt at the repo root — separate art for desktop and
 * mobile, because a single wide banner crops badly on a phone. Kept in sync
 * manually; the arrays are asserted to be the same length at runtime so a
 * slide index never falls through to the wrong image.
 */
// const HERO_BASE = HERO_BASE_DESKTOP;

export const HERO_SLIDES_DESKTOP = [
  `https://chhattisgarhhockeyleague.com/uploads/1stdesktop-aef2e57aed006fc8.png`,
  `https://chhattisgarhhockeyleague.com/uploads/2nddesktop-3291bd7a6b72bed9.png`,
  `https://chhattisgarhhockeyleague.com/uploads/3rddesktop%20banner-86ae2e06a29f5045.png`, 
] as const;  

export const HERO_SLIDES_MOBILE = [
  `https://chhattisgarhhockeyleague.com/uploads/1stMobile-36174a16e6c32dd7.png`,
  `https://chhattisgarhhockeyleague.com/uploads/2ndmobile-852580c5fe6c1258.png`, 
  `https://chhattisgarhhockeyleague.com/uploads/3rdmobile%20banner-23847d1f7d9fff8e.png`, 
] as const;

/** Fallback headline when no tournament is active yet. */
export const LEAGUE_FALLBACK_NAME = "Chhattisgarh Hockey League";

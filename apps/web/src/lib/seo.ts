import seoData from "./seo.data.json";

/**
 * SEO — per-route metadata for public pages.
 *
 * The copy lives in seo.data.json so this module and the post-build prerender
 * script (scripts/prerender.mjs) read the same source; they can't drift.
 *
 * The app is a client-rendered SPA, so `useSeo` writes document.title and the
 * meta tags on navigation. The prerender step additionally bakes per-route tags
 * into static HTML, which is what non-JS crawlers read.
 */

export const SITE_NAME = seoData.siteName;
export const SITE_URL = seoData.siteUrl;
export const TITLE_SUFFIX = seoData.titleSuffix;

export interface SeoMeta {
  title: string;
  description: string;
  /** Path used to build the canonical and og:url. */
  path: string;
  /** Omit from indexing (thin or duplicate pages). */
  noIndex?: boolean;
  /** Sensible defaults are applied per tag; override only when needed. */
  image?: string;
  type?: "website" | "article";
}

function toMeta(route: { path: string; title: string; description: string }): SeoMeta {
  return { ...route };
}

export const SEO: Record<string, SeoMeta> = Object.fromEntries(
  seoData.routes.map((route) => [route.path, toMeta(route)])
);

/** Routes not listed above fall back to this. */
export const DEFAULT_SEO: SeoMeta = {
  title: SITE_NAME,
  description: seoData.defaultDescription,
  path: "/",
  noIndex: true,
};

/** Longest-prefix match, so /teams/:id inherits the /teams copy. */
export function seoForPath(pathname: string): SeoMeta {
  if (SEO[pathname]) return SEO[pathname];

  const match = Object.keys(SEO)
    .filter((key) => key !== "/" && pathname.startsWith(key))
    // Prefer the most specific route, e.g. /teams over /news.
    .sort((a, b) => b.length - a.length)[0];

  if (match) return SEO[match];

  // Known public route we deliberately did not give copy: keep it indexable
  // with the league description rather than marking it noindex.
  return { ...DEFAULT_SEO, path: pathname, noIndex: false };
}
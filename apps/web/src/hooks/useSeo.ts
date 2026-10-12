import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { seoForPath, SITE_NAME, SITE_URL, TITLE_SUFFIX, type SeoMeta } from "../lib/seo.js";

/**
 * Applies per-route metadata on navigation: title, description, canonical,
 * Open Graph and Twitter cards, plus the robots meta.
 *
 * Tags are created on demand and then updated in place, so navigating between
 * routes doesn't accumulate duplicate <meta> elements.
 */

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Optional per-page override; otherwise derived from the pathname. */
export function useSeo(override?: Partial<SeoMeta>) {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = { ...seoForPath(pathname), ...override };
    const url = `${SITE_URL}${meta.path}`;
    const fullTitle = meta.title.endsWith(TITLE_SUFFIX) ? meta.title : `${meta.title}${TITLE_SUFFIX}`;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', "name", "description", meta.description);
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      meta.noIndex ? "noindex, nofollow" : "index, follow"
    );

    // Open Graph
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", meta.description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:type"]', "property", "og:type", meta.type ?? "website");
    if (meta.image) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", meta.image);
    }

    // Twitter
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", meta.description);

    upsertLink("canonical", url);
  }, [pathname, override]);
}
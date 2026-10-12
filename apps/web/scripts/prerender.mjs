/**
 * Post-build prerender.
 *
 * The app is a client-rendered SPA, so every route is served the same
 * index.html and a non-JS crawler sees identical metadata everywhere. This
 * writes one static HTML file per public route with that route's title,
 * description, canonical, Open Graph tags and JSON-LD baked in.
 *
 * Runs after `vite build`, reads the same seo.data.json the app uses, and
 * needs no dependencies. Safe to skip: the site works fine without it, this
 * only improves what crawlers read.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const distDir = join(webRoot, "dist");

const seo = JSON.parse(readFileSync(join(webRoot, "src", "lib", "seo.data.json"), "utf8"));
const template = readFileSync(join(distDir, "index.html"), "utf8");

/** Per-route JSON-LD, so each page tells search engines what it is. */
function jsonLdFor(route) {
  const base = `${seo.siteUrl}${route.path}`;
  const common = { "@context": "https://schema.org" };

  if (route.path === "/") {
    return {
      ...common,
      "@type": "SportsOrganization",
      name: seo.siteName,
      alternateName: "CHL",
      url: `${seo.siteUrl}/`,
      logo: `${seo.siteUrl}/logo.png`,
      sport: "Hockey",
      description: route.description,
      foundingDate: "2026-08-26",
      location: {
        "@type": "Place",
        name: "Raipur, Chhattisgarh, India",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Raipur",
          addressRegion: "Chhattisgarh",
          addressCountry: "IN",
        },
      },
      event: {
        "@type": "SportsEvent",
        name: "Chhattisgarh Hockey League 2026",
        startDate: "2026-10-21",
        endDate: "2026-11-01",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        isAccessibleForFree: true,
        sport: "Hockey",
        location: {
          "@type": "Place",
          name: "SVP International Hockey Stadium",
          address: {
            "@type": "PostalAddress",
            streetAddress: "G.E. Road",
            addressLocality: "Raipur",
            addressRegion: "Chhattisgarh",
            addressCountry: "IN",
          },
        },
      },
    };
  }

  const pageType =
    {
      "/news": "CollectionPage",
      "/gallery": "CollectionPage",
      "/teams": "CollectionPage",
      "/matches": "CollectionPage",
      "/standings": "CollectionPage",
    }[route.path] ?? "WebPage";

  return {
    ...common,
    "@type": pageType,
    name: route.title,
    headline: route.title,
    description: route.description,
    url: base,
    isPartOf: { "@type": "WebSite", name: seo.siteName, url: `${seo.siteUrl}/` },
    publisher: { "@type": "Organization", name: seo.siteName, url: `${seo.siteUrl}/` },
  };
}

function headFor(route) {
  const url = `${seo.siteUrl}${route.path}`;
  const title = route.title.endsWith(seo.titleSuffix)
    ? route.title
    : `${route.title}${seo.titleSuffix}`;

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${route.description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${seo.siteName}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${route.description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${seo.siteUrl}/logo.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${route.description}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLdFor(route))}</script>`,
  ].join("\n    ");
}

/**
 * Replace the whole <head> content, keeping the meta/link/script tags Vite needs.
 *
 * Removal is done on whole blocks, never line by line: the static JSON-LD and
 * the explanatory comments in index.html span many lines, so a line-based filter
 * removes only the opening tag and leaks the rest into the page as bare text.
 */
function render(route) {
  const head = template.match(/<head>([\s\S]*?)<\/head>/i);
  if (!head) throw new Error("prerender: no <head> found in dist/index.html");

  let keep = head[1];

  // Whole-block removals. Order matters: comments first, so their contents
  // can't be re-matched by the tag patterns below.
  keep = keep
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi, "")
    .replace(/<meta\b[^>]*\bproperty=["']og:[^>]*>/gi, "")
    .replace(/<meta\b[^>]*\bname=["']twitter:[^>]*>/gi, "")
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, "");

  // Collapse the blank lines the removals left behind.
  keep = keep
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, i, all) => line.trim() !== "" || all[i - 1]?.trim() !== "")
    .join("\n    ")
    .trim();

  return template.replace(
    /<head>[\s\S]*?<\/head>/i,
    `<head>\n    ${keep}\n\n    ${headFor(route)}\n  </head>`
  );
}

let written = 0;
for (const route of seo.routes) {
  const html = render(route);
  // "/" stays as index.html; every other route gets its own directory index so
  // static hosts (nginx try_files) serve it without a rewrite rule.
  const outDir = route.path === "/" ? distDir : join(distDir, route.path.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html, "utf8");
  written += 1;
  console.log(`  prerendered ${route.path}`);
}

console.log(`prerender: wrote ${written} route file(s) into dist/`);
import type { MatchDto } from "@tournament/shared";
import { useEffect, useState } from "react";

import * as matchApi from "../../api/match.client.js";
import { MatchCard } from "../../components/MatchCard.js";
import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { FEATURED_MATCHES_SECTION } from "../../lib/featured-matches.js";

/**
 * Homepage curated-matches section.
 *
 * Deliberately built like UpcomingMatchesSection so the two read as the same
 * kind of block, but the fixtures are hand-picked: FEATURED_MATCHES_SECTION
 * lists the match ids and only those are fetched and shown, in that order.
 *
 * The heading and subtitle are edited in the config file, not here.
 */
export function FeaturedMatchesSection({
  onSelectMatch,
}: {
  onSelectMatch: (m: MatchDto) => void;
}) {
  const { eyebrow, heading, subtitle, matchIds } = FEATURED_MATCHES_SECTION;

  const [matches, setMatches] = useState<MatchDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nothing chosen yet - render nothing rather than an empty shell.
  if (matchIds.length === 0) return null;

  useEffect(() => {
    let ignore = false;
    matchApi
      .listMatches({ ids: [...matchIds], limit: 100 })
      .then((d) => {
        if (!ignore) setMatches(d.items);
      })
      .catch(() => {
        if (!ignore) setError("Could not load the featured matches");
      });
    return () => {
      ignore = true;
    };
  }, [matchIds]);

  return (
    <section id="featured-matches-section" className="bg-pitch-cream py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SectionEyebrow label={eyebrow} id="featured-matches-eyebrow" />
          <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">
            {heading}
          </h2>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
        </div>

        {error ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">{error}</p>
          </div>
        ) : matches === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl border border-slate-200/80 bg-white/60"
              />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No fixtures selected</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Add match ids to FEATURED_MATCHES_SECTION to show fixtures here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onSelect={onSelectMatch} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

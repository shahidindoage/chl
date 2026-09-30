import { useNavigate } from "react-router-dom";

import { CtaBanner } from "./home/CtaBanner.js";
import { HeroSection } from "./home/HeroSection.js";
import { useHomeData } from "./home/HomeDataContext.js";
import { LatestNewsSection } from "./home/LatestNewsSection.js";
import { RecentResultsSection } from "./home/RecentResultsSection.js";
import { StandingsSection } from "./home/StandingsSection.js";
import { UpcomingMatchesSection } from "./home/UpcomingMatchesSection.js";

/**
 * Public homepage rebuilt to match the design reference in ../../design.
 * Section order, palette, typography and the header/footer all follow that
 * mockup; every value comes from the real API through HomeDataProvider.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { tournament, upcoming, recent, live, standings, openAllMatches, openAllResults, openMatch, openArticle } = useHomeData();

  const exploreMatches = () => {
    const el = document.getElementById("upcoming-matches-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else navigate("/matches");
  };

  return (
    <div className="flex min-h-screen flex-col bg-pitch-cream font-sans text-slate-900">
      <main className="flex-1">
        <HeroSection tournament={tournament} />

        {live.length > 0 && (
          <section className="border-b border-red-100 bg-red-50/60">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">Live Now</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/matches/${m.id}/live`)}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors hover:bg-red-100/60"
                  >
                    <span className="font-semibold">
                      <span style={{ color: m.teamA.color1 }}>{m.teamA.shortName}</span> {m.teamAScore} – {m.teamBScore}{" "}
                      <span style={{ color: m.teamB.color1 }}>{m.teamB.shortName}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-red-600">Watch live →</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <UpcomingMatchesSection matches={upcoming} onViewAll={openAllMatches} onSelectMatch={openMatch} />

        <StandingsSection standings={standings} />

        <RecentResultsSection matches={recent} onViewAll={openAllResults} onSelectMatch={openMatch} />

        <CtaBanner onExplore={exploreMatches} />

        <LatestNewsSection onSelectArticle={openArticle} />
      </main>
    </div>
  );
}

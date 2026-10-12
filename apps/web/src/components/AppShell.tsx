import { Outlet, useLocation } from "react-router-dom";

import { HomeDataProvider, useHomeData } from "../public/home/HomeDataContext.js";
import { SiteFooter } from "./SiteFooter.js";
import { SiteHeader } from "./SiteHeader.js";
import {
  AboutModal,
  AllMatchesModal,
  AllResultsModal,
  LiveScoresModal,
  MatchDetailModal,
  SearchModal,
} from "./home/HomeModals.js";

/**
 * Global shell: fixed site header, routed outlet, site footer, and the
 * homepage modals. The design triggered those modals from the header, so
 * they have to live above the router outlet rather than inside HomePage.
 */
function Shell() {
  const { pathname } = useLocation();
  const {
    tournament, standings, counts, live, allUpcoming, allResults,
    liveOpen, searchOpen, allMatchesOpen, allResultsOpen, aboutOpen, detail,
    openLive, openSearch, openAbout, openMatch,
    closeDetail, closeLive, closeSearch, closeAllMatches, closeAllResults, closeAbout,
  } = useHomeData();

  // The header is sticky (in flow), so nothing has to offset it. The homepage
  // stays full-bleed so its banner runs edge to edge directly beneath the bar,
  // and interior pages get the standard container with their own top padding.
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-pitch-cream font-sans text-slate-900">
      <SiteHeader onOpenSearch={openSearch} onOpenLiveScores={openLive} onOpenAbout={openAbout} />

{/* The sticky header occupies flow space, so nothing needs to offset it. The
          homepage stays full-bleed (no max-width, no side padding) so the banner
          runs edge to edge directly beneath the bar. */}
      <div
        className={
          isHome
            ? "flex-1"
            : "mx-auto w-full max-w-7xl flex-1 px-4 pb-12 sm:px-6 lg:px-8"
        }
      >
        <Outlet />
      </div>

      <SiteFooter />

      <LiveScoresModal isOpen={liveOpen} matches={live} onClose={closeLive} />
      <AllMatchesModal isOpen={allMatchesOpen} matches={allUpcoming} onClose={closeAllMatches} onSelectMatch={openMatch} />
      <AllResultsModal isOpen={allResultsOpen} matches={allResults} onClose={closeAllResults} onSelectMatch={openMatch} />
      <MatchDetailModal match={detail} onClose={closeDetail} />
      <SearchModal
        isOpen={searchOpen}
        matches={[...allUpcoming, ...allResults]}
        onClose={closeSearch}
        onSelectMatch={openMatch}
      />
      <AboutModal
        isOpen={aboutOpen}
        tournament={tournament}
        standings={standings}
        teamCount={counts.teams}
        venueCount={counts.venues}
        playerCount={counts.players}
        onClose={closeAbout}
      />
    </div>
  );
}

export function AppShell() {
  return (
    <HomeDataProvider>
      <Shell />
    </HomeDataProvider>
  );
}

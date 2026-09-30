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
  NewsArticleModal,
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
    liveOpen, searchOpen, allMatchesOpen, allResultsOpen, aboutOpen, detail, article,
    openLive, openSearch, openAbout, openMatch,
    closeDetail, closeLive, closeSearch, closeAllMatches, closeAllResults, closeAbout, closeArticle,
  } = useHomeData();

  // The homepage hero supplies its own top spacing; every other page needs
  // padding to clear the fixed header.
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-pitch-cream font-sans text-slate-900">
      <SiteHeader onOpenSearch={openSearch} onOpenLiveScores={openLive} onOpenAbout={openAbout} />

      {/* The homepage runs full-bleed; every other page gets the standard
          container plus room for the fixed header. */}
      <div className={isHome ? "flex-1" : "mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8"}>
        <Outlet />
      </div>

      <SiteFooter />

      <LiveScoresModal isOpen={liveOpen} matches={live} onClose={closeLive} />
      <AllMatchesModal isOpen={allMatchesOpen} matches={allUpcoming} onClose={closeAllMatches} onSelectMatch={openMatch} />
      <AllResultsModal isOpen={allResultsOpen} matches={allResults} onClose={closeAllResults} onSelectMatch={openMatch} />
      <MatchDetailModal match={detail} onClose={closeDetail} />
      <NewsArticleModal article={article} onClose={closeArticle} />
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

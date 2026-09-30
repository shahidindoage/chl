import type { MatchDetailDto, MatchDto, StandingsDto, TournamentDto } from "@tournament/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as matchApi from "../../api/match.client.js";
import * as standingsApi from "../../api/standings.client.js";
import * as teamApi from "../../api/team.client.js";
import * as tournamentApi from "../../api/tournament.client.js";
import type { NewsItem } from "../../lib/dummyNews.js";

/**
 * Single source of truth for the header, footer and homepage sections.
 *
 * The design reference put the header, the sections and seven modals in one
 * component tree. Here the header is global (it lives in the router layout),
 * so the fetch and modal state are lifted into this provider instead of being
 * duplicated per page.
 */

const PREVIEW_LIMIT = 4;
const LIVE_POLL_MS = 30_000;

interface HomeData {
  tournament: TournamentDto | null;
  upcoming: MatchDto[];
  recent: MatchDto[];
  live: MatchDto[];
  standings: StandingsDto | null;
  allUpcoming: MatchDto[];
  allResults: MatchDto[];
  counts: { teams: number; venues: number; players: number };

  liveOpen: boolean;
  searchOpen: boolean;
  allMatchesOpen: boolean;
  allResultsOpen: boolean;
  aboutOpen: boolean;
  authOpen: boolean;
  detail: MatchDetailDto | null;
  article: NewsItem | null;

  openLive: () => void;
  openSearch: () => void;
  openAllMatches: () => void;
  openAllResults: () => void;
  openAbout: () => void;
  openAuth: () => void;
  openMatch: (m: MatchDto) => void;
  openArticle: (a: NewsItem) => void;
  closeDetail: () => void;
  closeLive: () => void;
  closeSearch: () => void;
  closeAllMatches: () => void;
  closeAllResults: () => void;
  closeAbout: () => void;
  closeAuth: () => void;
  closeArticle: () => void;

  refreshLive: () => void;
}

const HomeDataContext = createContext<HomeData | null>(null);

export function HomeDataProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [upcomingRaw, setUpcomingRaw] = useState<MatchDto[]>([]);
  const [recent, setRecent] = useState<MatchDto[]>([]);
  const [live, setLive] = useState<MatchDto[]>([]);
  const [standings, setStandings] = useState<StandingsDto | null>(null);
  const [allResults, setAllResults] = useState<MatchDto[]>([]);
  const [counts, setCounts] = useState({ teams: 0, venues: 0, players: 0 });

  const [liveOpen, setLiveOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allMatchesOpen, setAllMatchesOpen] = useState(false);
  const [allResultsOpen, setAllResultsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [detail, setDetail] = useState<MatchDetailDto | null>(null);
  const [article, setArticle] = useState<NewsItem | null>(null);

  // A fixture keeps status "upcoming" until a score manager starts it, so a
  // match whose kickoff has already passed is expired and must be dropped
  // from both the 4-card preview and the full-schedule modal. Derived on read
  // so a fixture that lapses while the page sits open also disappears.
  const allUpcoming = useMemo(
    () =>
      upcomingRaw
        .filter((m) => new Date(m.date).getTime() >= Date.now())
        .sort((a, b) => a.date.localeCompare(b.date)),
    [upcomingRaw]
  );
  const upcoming = useMemo(() => allUpcoming.slice(0, PREVIEW_LIMIT), [allUpcoming]);

  // Section data. Every list fails independently so one dead endpoint never
  // blanks the page.
  useEffect(() => {
    tournamentApi.getActiveTournament().then(setTournament).catch(() => setTournament(null));
    standingsApi.getActiveStandings().then(setStandings).catch(() => setStandings(null));

    matchApi
      .listMatches({ page: 1, limit: 50, status: "upcoming" })
      .then((d) => setUpcomingRaw(d.items))
      .catch(() => setUpcomingRaw([]));

    matchApi
      .listMatches({ page: 1, limit: 50, status: "completed" })
      .then((d) => {
        const sorted = [...d.items].sort((a, b) => b.date.localeCompare(a.date));
        setRecent(sorted.slice(0, PREVIEW_LIMIT));
        setAllResults(sorted);
      })
      .catch(() => {
        setRecent([]);
        setAllResults([]);
      });
  }, []);

  const fetchLive = useCallback(() => {
    matchApi
      .listMatches({ page: 1, limit: 10, status: "live" })
      .then((d) => setLive(d.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchLive();
    const timer = setInterval(fetchLive, LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [fetchLive]);

  useEffect(() => {
    teamApi
      .listTeams({ page: 1, limit: 1 })
      .then((d) => setCounts((c) => ({ ...c, teams: d.pagination.total })))
      .catch(() => undefined);
    tournamentApi
      .listVenues({ page: 1, limit: 1 })
      .then((d) => setCounts((c) => ({ ...c, venues: d.pagination.total })))
      .catch(() => undefined);
  }, []);

  const openMatch = useCallback(
    (m: MatchDto) => {
      setAllMatchesOpen(false);
      setAllResultsOpen(false);
      setSearchOpen(false);
      matchApi
        .getMatch(m.id)
        .then(setDetail)
        .catch(() => navigate(`/matches/${m.id}`));
    },
    [navigate]
  );

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const value = useMemo<HomeData>(
    () => ({
      tournament,
      upcoming,
      recent,
      live,
      standings,
      allUpcoming,
      allResults,
      counts,
      liveOpen,
      searchOpen,
      allMatchesOpen,
      allResultsOpen,
      aboutOpen,
      authOpen,
      detail,
      article,
      openLive: () => setLiveOpen(true),
      openSearch: () => setSearchOpen(true),
      openAllMatches: () => setAllMatchesOpen(true),
      openAllResults: () => setAllResultsOpen(true),
      openAbout: () => setAboutOpen(true),
      openAuth: () => setAuthOpen(true),
      openMatch,
      openArticle: setArticle,
      closeDetail: () => setDetail(null),
      closeLive: () => setLiveOpen(false),
      closeSearch: () => setSearchOpen(false),
      closeAllMatches: () => setAllMatchesOpen(false),
      closeAllResults: () => setAllResultsOpen(false),
      closeAbout: () => setAboutOpen(false),
      closeAuth,
      closeArticle: () => setArticle(null),
      refreshLive: fetchLive,
    }),
    [
      tournament, upcoming, recent, live, standings, allUpcoming, allResults, counts,
      liveOpen, searchOpen, allMatchesOpen, allResultsOpen, aboutOpen, authOpen, detail, article,
      openMatch, closeAuth, fetchLive,
    ]
  );

  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}

export function useHomeData(): HomeData {
  const ctx = useContext(HomeDataContext);
  if (!ctx) throw new Error("useHomeData must be used inside <HomeDataProvider>");
  return ctx;
}

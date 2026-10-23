import { Menu, Radio, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { LEAGUE_ASSETS } from "../lib/assets.js";
import { useHomeData } from "../public/home/HomeDataContext.js";
import { useAuthStore } from "../store/auth.store.js";
import { AuthModal } from "./AuthModal.js";

/**
 * Site header ported from the homepage design reference: fixed, transparent
 * over the hero and solid everywhere else. Nav targets are real routes
 * instead of the design's scroll-to-section handler.
 */

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/teams", label: "Teams", end: false },
  { to: "/matches", label: "Matches", end: false },
  { to: "/standings", label: "Standings", end: false },

  { to: "/news", label: "News", end: false },
  { to: "/fans", label: "Fans", end: false },
  { to: "/gallery", label: "Photo Gallery", end: false },
] as const;

/** Pages grouped under the About dropdown. */
const ABOUT_ITEMS = [
  { to: "/about", label: "About the League", blurb: "Format, history and development" },
  { to: "/ambassador", label: "League Ambassador", blurb: "The Face of Chhattisgarh Hockey" },
  { to: "/sponsors", label: "Sponsors", blurb: "The partners behind the league" },
] as const;

const ABOUT_ROUTES: ReadonlySet<string> = new Set<string>(ABOUT_ITEMS.map((i) => i.to));

/**
 * Routes that render a full-bleed <PageHero> (or the homepage hero). The
 * header stays transparent over these. All of them use a light cream wash, so
 * the bar keeps dark text and the logo keeps its real colours — a route not
 * listed falls back to the solid white bar. Extend as pages adopt PageHero.
 */
const PAGE_HERO_ROUTES = new Set([
  "/matches", "/standings", "/teams", "/news", "/reels", "/gallery",
  "/fans", "/quizzes", "/predict", "/leaderboard",
]);

for (const route of ABOUT_ROUTES) PAGE_HERO_ROUTES.add(route);

export interface SiteHeaderProps {
  onOpenSearch: () => void;
  onOpenLiveScores: () => void;
  /** Unused while both About buttons are commented out. */
  onOpenAbout: () => void;
}

export function SiteHeader({ onOpenSearch, onOpenLiveScores, onOpenAbout: _onOpenAbout }: SiteHeaderProps) {
  // `_onOpenAbout` is currently unreferenced: both About buttons (desktop nav
  // and mobile menu) are commented out. Kept in the props so re-enabling
  // either one is a single uncomment.
  const { user, status } = useAuthStore();
  const { authOpen, openAuth, closeAuth } = useHomeData();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // The header is always solid. It used to go transparent over pages with a light
  // cream hero, but that left the bar floating over light artwork with no
  // contrast guarantee. PAGE_HERO_ROUTES is kept for reference in case the
  // transparent variant is ever wanted back.
  void PAGE_HERO_ROUTES;
  void pathname;
  const solid = true;

  useEffect(() => {
    setMobileMenuOpen(false);
    setAboutOpen(false);
  }, [pathname]);

  // Any click outside the dropdown closes it.
  useEffect(() => {
    if (!aboutOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-about-menu]")) setAboutOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAboutOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [aboutOpen]);

  const isAdmin = Boolean(user && user.role !== "fan");

  return (
    <header
      /* sticky, not fixed: the bar stays visible but occupies flow space, so page
         content starts underneath it with no compensating padding anywhere. */
      className={`sticky top-0 z-40 transition-all duration-300 ${
        solid
          ? "border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <img
        src={LEAGUE_ASSETS.patch}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-20 hidden h-16 w-auto select-none object-contain opacity-90 sm:block sm:h-20 lg:h-24"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between transition-all duration-300 sm:h-24">
          {/* Hamburger and the main logo travel together as one left-hand group.
              Keeping them as separate flex children let justify-between push
              the logo into the centre of the bar on mobile. */}
          <div className="flex min-w-0 items-center">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="-ml-2 flex shrink-0 items-center rounded-lg p-2 text-slate-700 transition-colors hover:text-slate-950 lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link
              to="/"
              className="group relative z-20 flex select-none items-center sm:pl-14 lg:pl-0"
              aria-label="Chhattisgarh Hockey League home"
            >
              <img
                src={LEAGUE_ASSETS.logo}
                alt="Chhattisgarh Hockey League"
                className={`w-auto origin-left object-contain transition-all duration-300 group-hover:scale-105 ${
                  solid ? "h-14 drop-shadow-sm sm:h-16" : "h-24 translate-y-2.5 drop-shadow-md sm:h-28 lg:h-32"
                }`}
              />
            </Link>
          </div>

          <nav className="hidden items-center gap-5 lg:flex xl:gap-10" id="header-nav">
            {/* First item is always Home. */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative whitespace-nowrap py-2 text-sm font-semibold transition-colors duration-200 lg:text-[15px] ${
                  isActive ? "text-pitch-orange-dark" : "text-[#1e293b] hover:text-pitch-orange-dark"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  Home
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-pitch-orange-dark" />
                  )}
                </>
              )}
            </NavLink>

            {/* Then the About dropdown, then the rest of the nav. */}
            <div
              className="relative"
              data-about-menu
              onMouseEnter={() => setAboutOpen(true)}
              onMouseLeave={() => setAboutOpen(false)}
            >
              <button
                type="button"
                aria-expanded={aboutOpen}
                aria-haspopup="true"
                onClick={() => setAboutOpen((v) => !v)}
                className={`relative flex items-center whitespace-nowrap py-2 text-sm font-semibold transition-colors duration-200 lg:text-[15px] ${
                  aboutOpen || ABOUT_ROUTES.has(pathname)
                    ? "text-pitch-orange-dark"
                    : "text-[#1e293b] hover:text-pitch-orange-dark"
                }`}
              >
                About
                {(aboutOpen || ABOUT_ROUTES.has(pathname)) && (
                  <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-pitch-orange-dark" />
                )}
              </button>

              {aboutOpen && (
                <div className="absolute left-1/2 top-full z-30 w-72 -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    {ABOUT_ITEMS.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-orange-50/60"
                      >
                        <span className="block text-sm font-semibold text-navy">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{item.blurb}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {NAV_ITEMS.filter((item) => item.to !== "/").map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative whitespace-nowrap py-2 text-sm font-semibold transition-colors duration-200 lg:text-[15px] ${
                    isActive ? "text-pitch-orange-dark" : "text-[#1e293b] hover:text-pitch-orange-dark"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-pitch-orange-dark" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Search first, auth last: the account action is always the
              right-most control in the header. */}
          <div className="hidden items-center gap-4 lg:flex lg:gap-5">
            <button
              onClick={onOpenSearch}
              aria-label="Search league"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-orange-50/70 hover:text-pitch-orange-dark"
            >
              <Search className="h-5 w-5 stroke-[2.2]" />
            </button>

            {status === "authenticated" && user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="whitespace-nowrap text-sm font-semibold text-pitch-orange-dark transition-colors hover:text-pitch-orange"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/account"
                  aria-label="Your account"
                  title={user.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-pitch-orange text-white shadow-sm transition-all duration-200 hover:bg-pitch-orange-dark hover:shadow"
                >
                  <User className="h-5 w-5 stroke-[2.2]" />
                </Link>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="whitespace-nowrap rounded-full bg-pitch-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-pitch-orange-dark hover:shadow"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Secondary league mark, last item in the header. Sized on the
              same scale as the main logo and dimmed slightly so it reads as
              secondary to the primary mark on the left. */}
          <img
            src={LEAGUE_ASSETS.headerLogo2}
            alt="Chhattisgarh Hockey League"
            className={`hidden shrink-0 select-none object-contain opacity-90 transition-all duration-300 lg:block ${
              solid ? "h-12" : "h-20"
            }`}
          />

          {/* Search and the secondary mark, right-aligned on mobile. The
              hamburger now lives on the far left. */}
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={onOpenSearch} aria-label="Search" className="p-2 text-slate-700">
              <Search className="h-5 w-5" />
            </button>

            {/* Secondary mark, last in the bar on small screens too. Smaller
                than the main logo for the same reason it is dimmer. */}
            <img
              src={LEAGUE_ASSETS.headerLogo2}
              alt="Chhattisgarh Hockey League"
              className={`shrink-0 select-none object-contain opacity-90 transition-all duration-300 ${
                solid ? "h-8" : "h-14"
              }`}
            />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pb-6 pt-3 shadow-lg lg:hidden">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive ? "bg-orange-50 font-semibold text-pitch-orange-dark" : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {/* Mobile has no hover, so the three pages list flat. */}
            {ABOUT_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive ? "bg-orange-50 font-semibold text-pitch-orange-dark" : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {status === "authenticated" && user ? (
              <>
                <p className="px-1 text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-700">{user.name}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/account"
                    className="flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <User className="h-4 w-4" />
                    My account
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-pitch-orange-dark"
                    >
                      Admin panel
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuth();
                }}
                className="w-full rounded-full bg-pitch-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Sign in / Create account
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLiveScores();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              <Radio className="h-4 w-4" />
              <span>View Live Scores</span>
            </button>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={closeAuth} />
    </header>
  );
}

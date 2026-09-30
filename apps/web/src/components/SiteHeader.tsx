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
  { to: "/matches", label: "Matches", end: false },
  { to: "/standings", label: "Standings", end: false },
  { to: "/teams", label: "Teams", end: false },
  // { to: "/players", label: "Players", end: false },
  // { to: "/venues", label: "Venues", end: false },
   { to: "/fans", label: "Fans", end: false },
  { to: "/news", label: "News", end: false },
 
] as const;

/**
 * Routes that render a full-bleed <PageHero> (or the homepage hero). The
 * header stays transparent over these. All of them use a light cream wash, so
 * the bar keeps dark text and the logo keeps its real colours — a route not
 * listed falls back to the solid white bar. Extend as pages adopt PageHero.
 */
const PAGE_HERO_ROUTES = new Set(["/matches", "/standings", "/teams", "/players", "/venues", "/news", "/fans"]);

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
  const [scrolled, setScrolled] = useState(false);

  // A transparent bar is only possible where light artwork sits underneath.
  const canBeTransparent = pathname === "/" || PAGE_HERO_ROUTES.has(pathname);
  const solid = scrolled || mobileMenuOpen || !canBeTransparent;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isAdmin = Boolean(user && user.role !== "fan");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
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
          <Link
            to="/"
            className="group relative z-20 flex select-none items-center pl-10 sm:pl-14 lg:pl-0"
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

          <nav className="hidden items-center gap-8 lg:gap-10 md:flex" id="header-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative py-2 text-sm font-semibold transition-colors duration-200 lg:text-[15px] ${
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
            {/* <button
              onClick={onOpenAbout}
              className="relative py-2 text-sm font-semibold text-[#1e293b] transition-colors duration-200 hover:text-pitch-orange-dark lg:text-[15px]"
            >
              About
            </button> */}
          </nav>

          {/* Search first, auth last: the account action is always the
              right-most control in the header. */}
          <div className="hidden items-center gap-4 sm:flex lg:gap-5">
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
                    className="text-sm font-semibold text-pitch-orange-dark transition-colors hover:text-pitch-orange"
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
                className="rounded-full bg-pitch-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-pitch-orange-dark hover:shadow"
              >
                Sign in
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button onClick={onOpenSearch} aria-label="Search" className="p-2 text-slate-700">
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-700 transition-colors hover:text-slate-950"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pb-6 pt-3 shadow-lg sm:hidden">
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
            {/* <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              About
            </button> */}
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

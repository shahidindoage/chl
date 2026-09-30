import type { MatchDto } from "@tournament/shared";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as matchApi from "../api/match.client.js";
import { LEAGUE_ASSETS } from "../lib/assets.js";
import { formatMatchTime, formatShortDate } from "../lib/format.js";
import { useAuthStore } from "../store/auth.store.js";
import { TeamCrest } from "./TeamCrest.js";

/**
 * Site footer ported from the homepage design reference. The design listed
 * three hardcoded upcoming fixtures; this pulls the next three from the API
 * so the column is never stale.
 */

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
] as const;

export function SiteFooter() {
  const user = useAuthStore((s) => s.user);
  const [fixtures, setFixtures] = useState<MatchDto[]>([]);

  useEffect(() => {
    let ignore = false;
    matchApi
      .listMatches({ page: 1, limit: 20, status: "upcoming" })
      .then((d) => {
        if (ignore) return;
        // Kickoff already passed but nobody started it — not upcoming.
        const now = Date.now();
        setFixtures(
          d.items
            .filter((m) => new Date(m.date).getTime() >= now)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
        );
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/matches", label: "Matches & Fixtures" },
    { to: "/standings", label: "Points Table" },
    { to: "/news", label: "Latest News" },
   
    { to: "/players", label: "Players" },
    { to: "/venues", label: "Venues" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-emerald-900/60 bg-pitch-pitch pt-14 pb-8 text-emerald-100/90">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* About */}
          <div className="space-y-4" id="footer-col-about">
            <Link to="/" className="group inline-flex items-center gap-3">
              <img
                src={LEAGUE_ASSETS.logo}
                alt="Chhattisgarh Hockey League"
                className="h-20 w-auto select-none object-contain brightness-0 invert transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-xs leading-relaxed text-emerald-100/75 sm:text-sm">
              {user
                ? `Welcome back, ${user.name}. Follow the fixtures, standings and live scores from around the league.`
                : "The Chhattisgarh Hockey League is the state's premier field hockey championship, uniting franchise teams, world-class synthetic turfs, and rising grassroots stars."}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-emerald-200/80">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-pitch-orange" />
              <span>Raipur, Chhattisgarh, India</span>
            </div>
          </div>

          {/* Featured fixtures */}
          <div className="space-y-4" id="footer-col-matches">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pitch-orange" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Upcoming Matches</h4>
            </div>

            {fixtures.length === 0 ? (
              <p className="text-xs text-emerald-300/70">No upcoming fixtures scheduled.</p>
            ) : (
              <div className="space-y-2">
                {fixtures.map((m) => (
                  <Link
                    key={m.id}
                    to={`/matches/${m.id}`}
                    className="group block border-b border-emerald-800/35 py-1.5 transition-colors last:border-b-0"
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <TeamCrest name={m.teamA.name} shortName={m.teamA.shortName} color1={m.teamA.color1} logo={m.teamA.logo} size="sm" />
                        <span className="truncate pr-1 font-semibold text-white transition-colors group-hover:text-pitch-orange">
                          {m.teamA.shortName}
                        </span>
                        <span className="font-normal text-emerald-400">vs</span>
                        <TeamCrest name={m.teamB.name} shortName={m.teamB.shortName} color1={m.teamB.color1} logo={m.teamB.logo} size="sm" />
                        <span className="truncate font-semibold text-white transition-colors group-hover:text-pitch-orange">
                          {m.teamB.shortName}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-pitch-orange">
                        {formatMatchTime(m.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/65">
                      <Calendar className="h-3 w-3 shrink-0 text-emerald-400/80" />
                      <span>{formatShortDate(m.date)}</span>
                      <span>•</span>
                      <span className="truncate">{m.venue?.name ?? "Venue TBA"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/matches"
              className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-pitch-orange transition-colors hover:text-orange-300"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick links */}
          <div className="space-y-4" id="footer-col-quicklinks">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pitch-orange" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Quick Links</h4>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-2 text-emerald-100/80 transition-colors hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 transition-colors group-hover:bg-pitch-orange" />
                    <span className="transition-transform group-hover:translate-x-0.5">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4" id="footer-col-social">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pitch-orange" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Connect With Us</h4>
            </div>
            <p className="text-xs leading-relaxed text-emerald-100/75 sm:text-sm">
              Follow official channels for live tournament updates, match highlights, and ticket announcements.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60 text-emerald-200 transition-all hover:border-pitch-orange hover:bg-pitch-orange hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
            <div className="pt-2 text-[11px] text-emerald-300/70">Official Media Partner &amp; Broadcast Hub</div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-emerald-900/80 pt-6 text-xs text-emerald-200/70 sm:flex-row sm:pr-40">
          <p>&copy; {new Date().getFullYear()} Chhattisgarh Hockey League. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[11px] text-emerald-300/60">
            <span>Fair Play Code</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 z-0 select-none">
        <img
          src={LEAGUE_ASSETS.patch}
          alt=""
          aria-hidden="true"
          className="h-auto w-28 rotate-180 object-contain sm:w-36 md:w-44 lg:w-52"
          loading="lazy"
        />
      </div>
    </footer>
  );
}

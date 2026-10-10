import type { TeamDto } from "@tournament/shared";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as teamApi from "../api/team.client.js";
import { LEAGUE_ASSETS } from "../lib/assets.js";
import { useAuthStore } from "../store/auth.store.js";

/**
 * Site footer ported from the homepage design reference. The design listed
 * three hardcoded upcoming fixtures; this pulls the league's teams from the API
 * so the column is never stale.
 */

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1A8Bcp1PPT",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  }
 
] as const;

export function SiteFooter() {
  const user = useAuthStore((s) => s.user);
  const [teams, setTeams] = useState<TeamDto[]>([]);

  useEffect(() => {
    let ignore = false;
    teamApi
      .listTeams({ page: 1, limit: 6 })
      .then((d) => {
        if (!ignore) setTeams(d.items);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About the League" },
    { to: "/matches", label: "Matches & Fixtures" },
    { to: "/standings", label: "Points Table" },
    { to: "/news", label: "Latest News" },
    { to: "/fans", label: "Fans Hub" },
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

          {/* Teams */}
          <div className="space-y-4" id="footer-col-matches">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-pitch-orange" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white sm:text-sm">Teams</h4>
            </div>

            {teams.length === 0 ? (
              <p className="text-xs text-emerald-300/70">No teams registered yet.</p>
            ) : (
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/teams/${t.id}`}
                      className="group inline-flex items-center gap-2 text-emerald-100/80 transition-colors hover:text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 transition-colors group-hover:bg-pitch-orange" />
                      <span className="transition-transform group-hover:translate-x-0.5">{t.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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

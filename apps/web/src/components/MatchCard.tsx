import type { MatchDto } from "@tournament/shared";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { formatMatchDate, formatMatchTime } from "../lib/format.js";
import { TeamCrest } from "./TeamCrest.js";

/**
 * The match card used by the homepage "Next Matches" / "Recent Matches"
 * sections and the fixtures page. Extracted so all three stay identical.
 *
 * Renders a scoreline for finished/live matches and a kickoff time for
 * upcoming ones. Navigate with `to` (a link) or `onSelect` (a button, used
 * where the homepage opens the modal instead of routing).
 */

export interface MatchCardProps {
  match: MatchDto;
  /** Renders a react-router Link when provided. */
  to?: string;
  /** Renders a button that calls this. Ignored when `to` is set. */
  onSelect?: (m: MatchDto) => void;
  /** Green left rule, used to highlight the most recent result. */
  highlight?: boolean;
  /** Overrides the footer line. */
  cta?: string;
}

export function MatchCard({ match, to, onSelect, highlight = false, cta }: MatchCardProps) {
  const finished = match.status === "completed";
  const isLive = match.status === "live";
  const showScore = finished || isLive;

  const body = (
    <>
      {/* Date + venue */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5 font-medium">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-[#166534]" />
          <span className="whitespace-nowrap">{formatMatchDate(match.date)}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#166534]" />
          <span className="truncate">{match.venue?.name ?? "TBA"}</span>
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-1 py-5">
        <div className="flex flex-1 flex-col items-center text-center">
          <TeamCrest
            name={match.teamA.name}
            shortName={match.teamA.shortName}
            color1={match.teamA.color1}
            logo={match.teamA.logo}
            size="lg"
            className="transition-transform group-hover:scale-105"
          />
          <span className="mt-2.5 line-clamp-2 max-w-[90px] text-xs font-bold leading-tight text-navy">
            {match.teamA.name}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          {showScore ? (
            <>
              <div className={`text-xl font-extrabold tracking-tight sm:text-2xl ${isLive ? "text-red-600" : "text-navy"}`}>
                {match.teamAScore} - {match.teamBScore}
              </div>
              <div
                className={`mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white ${
                  isLive ? "bg-red-600" : "bg-[#15803d]"
                }`}
              >
                {isLive ? "LIVE" : "FT"}
              </div>
            </>
          ) : (
            <span className="px-2 text-sm font-extrabold tracking-wider text-navy">VS</span>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center text-center">
          <TeamCrest
            name={match.teamB.name}
            shortName={match.teamB.shortName}
            color1={match.teamB.color1}
            logo={match.teamB.logo}
            size="lg"
            className="transition-transform group-hover:scale-105"
          />
          <span className="mt-2.5 line-clamp-2 max-w-[90px] text-xs font-bold leading-tight text-navy">
            {match.teamB.name}
          </span>
        </div>
      </div>

      {/* Footer line */}
      <div
        className={`flex items-center justify-center border-t border-slate-100 pt-3 text-xs ${
          cta
            ? "text-[11px] font-medium text-slate-400 transition-colors group-hover:text-pitch-orange-dark"
            : "font-semibold text-slate-700"
        }`}
      >
        {cta ? (
          <span>{cta}</span>
        ) : isLive ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-red-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Watch live
          </span>
        ) : finished ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
            <Clock className="h-3.5 w-3.5" />
            Final
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#166534]" />
            {formatMatchTime(match.date)}
          </span>
        )}
      </div>
    </>
  );

  const shell = `group flex w-full flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md ${
    highlight ? "border-l-4 border-l-[#15803d]" : ""
  }`;

  if (to) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onSelect?.(match)} className={`${shell} cursor-pointer`}>
      {body}
    </button>
  );
}

import type { MatchDetailDto, MatchDto, StandingsDto, TournamentDto } from "@tournament/shared";
import { ArrowRight, Clock, MapPin, Search, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { formatDay, formatMatchDate, formatMatchTime, formatMonth } from "../../lib/format.js";
import { NEWS_FALLBACK_IMAGE, type NewsItem } from "../../lib/dummyNews.js";
import { TeamCrest } from "../TeamCrest.js";

/**
 * Homepage modals ported from the design reference, but bound to real API
 * data. The design's Live Scores modal hardcoded a score, quarter splits and
 * possession/circle/PC stats; none of those exist in the schema, so this
 * version shows only what Module 5 actually tracks and links through to the
 * full live page for the rest.
 */

function ModalShell({
  onClose,
  children,
  size = "max-w-2xl",
}: {
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`relative flex max-h-[90vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, icon, onClose }: { title: string; subtitle?: string; icon?: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between bg-navy px-6 py-4 text-white">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <h3 className="text-base font-bold tracking-wide lg:text-lg">{title}</h3>
          {subtitle && <p className="text-xs text-slate-300">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, label = "Close" }: { onClose: () => void; label?: string }) {
  return (
    <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
      <button onClick={onClose} className="rounded-full bg-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-300">
        {label}
      </button>
    </div>
  );
}

/* ---------------- Live scores ---------------- */

export function LiveScoresModal({
  isOpen,
  matches,
  onClose,
}: {
  isOpen: boolean;
  matches: MatchDto[];
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        title="Live Match Center"
        icon={
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        }
        onClose={onClose}
      />

      <div className="space-y-4 overflow-y-auto p-6">
        {matches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">No matches are live right now</p>
            <p className="mt-1 text-xs text-slate-500">Live matches appear here the moment a score manager starts them.</p>
            <Link to="/matches" onClick={onClose} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-pitch-orange-dark hover:underline">
              Browse all fixtures <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50/40 p-5">
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span className="rounded bg-red-100 px-2.5 py-1 font-bold uppercase tracking-wider text-red-700">
                  {m.currentPeriod ?? "Live"}
                  {m.currentMinute !== null ? ` • ${m.currentMinute}'` : ""}
                  {m.isPaused ? " • Paused" : ""}
                </span>
                <span className="truncate">{m.venue?.name ?? "Venue TBA"}</span>
              </div>

              <div className="flex items-center justify-between gap-2 py-4">
                <div className="flex flex-1 flex-col items-center text-center">
                  <TeamCrest name={m.teamA.name} shortName={m.teamA.shortName} color1={m.teamA.color1} logo={m.teamA.logo} size="lg" />
                  <span className="mt-2 text-sm font-bold text-slate-900 sm:text-base">{m.teamA.name}</span>
                </div>
                <div className="px-2 text-center">
                  <div className="text-3xl font-black tracking-tight text-navy sm:text-4xl">
                    {m.teamAScore} - {m.teamBScore}
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-center text-center">
                  <TeamCrest name={m.teamB.name} shortName={m.teamB.shortName} color1={m.teamB.color1} logo={m.teamB.logo} size="lg" />
                  <span className="mt-2 text-sm font-bold text-slate-900 sm:text-base">{m.teamB.name}</span>
                </div>
              </div>

              <div className="mt-3 flex justify-end border-t border-slate-200/80 pt-3">
                <Link
                  to={`/matches/${m.id}/live`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 rounded-full bg-pitch-orange px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-pitch-orange-dark"
                >
                  Open live page <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <ModalFooter onClose={onClose} />
    </ModalShell>
  );
}

/* ---------------- Match detail ---------------- */

export function MatchDetailModal({ match, onClose }: { match: MatchDetailDto | null; onClose: () => void }) {
  if (!match) return null;
  const finished = match.status === "completed";
  const goals = match.events.filter((e) => e.eventType === "goal");

  return (
    <ModalShell onClose={onClose} size="max-w-lg">
      <ModalHeader title="Match Details" icon={<Trophy className="h-5 w-5 text-orange-400" />} onClose={onClose} />

      <div className="space-y-6 overflow-y-auto p-6">
        <div className="text-center text-xs text-slate-500">
          {formatMatchDate(match.date)} • {match.venue?.name ?? "Venue TBA"}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-6">
          <div className="flex flex-1 flex-col items-center text-center">
            <TeamCrest name={match.teamA.name} shortName={match.teamA.shortName} color1={match.teamA.color1} logo={match.teamA.logo} size="xl" />
            <span className="mt-2 text-sm font-bold text-slate-900">{match.teamA.name}</span>
          </div>

          <div className="px-2 text-center">
            {finished ? (
              <>
                <div className="text-3xl font-black text-navy">
                  {match.teamAScore} - {match.teamBScore}
                </div>
                <span className="mt-1 inline-block rounded-full bg-[#15803d] px-2.5 py-0.5 text-[10px] font-bold text-white">FULL TIME</span>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-slate-700">VS</div>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{formatMatchTime(match.date)}</span>
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center text-center">
            <TeamCrest name={match.teamB.name} shortName={match.teamB.shortName} color1={match.teamB.color1} logo={match.teamB.logo} size="xl" />
            <span className="mt-2 text-sm font-bold text-slate-900">{match.teamB.name}</span>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Goals</h4>
            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700">
              {goals.map((g) => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-orange-dark" />
                  <span>
                    <b className="font-mono">{g.minute}'</b> {g.playerName ?? g.teamName ?? "Goal"}
                    {g.description ? ` — ${g.description}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {match.summary && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Match Report</h4>
            <p className="text-sm leading-relaxed text-slate-700">{match.summary}</p>
          </div>
        )}

        {match.status === "upcoming" && (
          <div className="space-y-2 rounded-xl border border-orange-200 bg-orange-50/70 p-4 text-xs text-slate-700">
            <div className="font-bold text-pitch-orange-dark">Matchday Information</div>
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Scheduled for {formatMatchTime(match.date)}
            </p>
            {match.venue && (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {match.venue.name}, {match.venue.city}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3">
        <span className="text-[11px] text-slate-400">
          {finished ? "Full timeline, lineups and report" : "Full schedule, squads and venue details"}
        </span>
        <Link
          to={`/matches/${match.id}`}
          onClick={onClose}
          className="group inline-flex items-center gap-2 rounded-full bg-pitch-orange px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-pitch-orange-dark"
        >
          <span>More details</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </ModalShell>
  );
}

/* ---------------- All matches / all results lists ---------------- */

function FixtureRow({ match, onSelect }: { match: MatchDto; onSelect: (m: MatchDto) => void }) {
  return (
    <button
      onClick={() => onSelect(match)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-pitch-orange-dark hover:shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-center">
          <span className="block text-xs font-bold text-[#166534]">{formatDay(match.date)}</span>
          <span className="block text-[10px] uppercase text-slate-500">{formatMonth(match.date)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <TeamCrest name={match.teamA.name} shortName={match.teamA.shortName} color1={match.teamA.color1} logo={match.teamA.logo} size="sm" />
              {match.teamA.name}
            </span>
            <span className="text-xs font-normal text-slate-400">vs</span>
            <span className="flex items-center gap-1.5">
              <TeamCrest name={match.teamB.name} shortName={match.teamB.shortName} color1={match.teamB.color1} logo={match.teamB.logo} size="sm" />
              {match.teamB.name}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate">{match.venue?.name ?? "Venue TBA"}</span>
            <span>•</span>
            <span>{formatMatchTime(match.date)}</span>
          </div>
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold text-pitch-orange-dark">Details →</span>
    </button>
  );
}

function ResultRow({ match, onSelect }: { match: MatchDto; onSelect: (m: MatchDto) => void }) {
  return (
    <button
      onClick={() => onSelect(match)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-center">
          <span className="block text-xs font-bold text-emerald-800">{formatDay(match.date)}</span>
          <span className="block text-[10px] uppercase text-emerald-600">{formatMonth(match.date)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <TeamCrest name={match.teamA.name} shortName={match.teamA.shortName} color1={match.teamA.color1} logo={match.teamA.logo} size="sm" />
              {match.teamA.name}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
              {match.teamAScore} - {match.teamBScore}
            </span>
            <span className="flex items-center gap-1.5">
              <TeamCrest name={match.teamB.name} shortName={match.teamB.shortName} color1={match.teamB.color1} logo={match.teamB.logo} size="sm" />
              {match.teamB.name}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">{match.venue?.name ?? "Venue TBA"} • Final</div>
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold text-emerald-700">Match Report →</span>
    </button>
  );
}

export function AllMatchesModal({
  isOpen,
  matches,
  onClose,
  onSelectMatch,
}: {
  isOpen: boolean;
  matches: MatchDto[];
  onClose: () => void;
  onSelectMatch: (m: MatchDto) => void;
}) {
  if (!isOpen) return null;
  return (
    <ModalShell onClose={onClose} size="max-w-3xl">
      <ModalHeader title="Fixtures" subtitle="Complete schedule for the current tournament" onClose={onClose} />
      <div className="space-y-3 overflow-y-auto p-6">
        {matches.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No fixtures scheduled yet.</p>
        ) : (
          matches.map((m) => <FixtureRow key={m.id} match={m} onSelect={onSelectMatch} />)
        )}
      </div>
      <ModalFooter onClose={onClose} />
    </ModalShell>
  );
}

export function AllResultsModal({
  isOpen,
  matches,
  onClose,
  onSelectMatch,
}: {
  isOpen: boolean;
  matches: MatchDto[];
  onClose: () => void;
  onSelectMatch: (m: MatchDto) => void;
}) {
  if (!isOpen) return null;
  return (
    <ModalShell onClose={onClose} size="max-w-3xl">
      <ModalHeader title="Past Match Results" subtitle="Complete scoreboard" onClose={onClose} />
      <div className="space-y-3 overflow-y-auto p-6">
        {matches.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No completed matches yet.</p>
        ) : (
          matches.map((m) => <ResultRow key={m.id} match={m} onSelect={onSelectMatch} />)
        )}
      </div>
      <ModalFooter onClose={onClose} />
    </ModalShell>
  );
}

/* ---------------- News article reader ---------------- */

export function NewsArticleModal({ article, onClose }: { article: NewsItem | null; onClose: () => void }) {
  if (!article) return null;

  return (
    <ModalShell onClose={onClose} size="max-w-2xl">
      <div className="relative aspect-[16/9] w-full shrink-0">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = NEWS_FALLBACK_IMAGE;
          }}
        />
        <button
          onClick={onClose}
          aria-label="Close article"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 font-bold text-pitch-orange-dark">{article.category}</span>
          <span>{formatMatchDate(article.date)}</span>
          <span>•</span>
          <span>{article.readTime}</span>
          <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Sample
          </span>
        </div>

        <h2 className="font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl">{article.title}</h2>

        <p className="border-l-[3px] border-pitch-orange-dark pl-4 text-base font-medium italic text-slate-600">
          {article.summary}
        </p>

        <div className="space-y-3 pt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
          {article.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      <ModalFooter onClose={onClose} label="Done Reading" />
    </ModalShell>
  );
}

/* ---------------- Search ---------------- */

export function SearchModal({
  isOpen,
  matches,
  onClose,
  onSelectMatch,
}: {
  isOpen: boolean;
  matches: MatchDto[];
  onClose: () => void;
  onSelectMatch: (m: MatchDto) => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const results = q
    ? matches.filter(
        (m) =>
          m.teamA.name.toLowerCase().includes(q) ||
          m.teamB.name.toLowerCase().includes(q) ||
          m.teamA.shortName.toLowerCase().includes(q) ||
          m.teamB.shortName.toLowerCase().includes(q) ||
          (m.venue?.name.toLowerCase().includes(q) ?? false) ||
          (m.venue?.city.toLowerCase().includes(q) ?? false)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 p-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams, venues, or matches…"
            className="flex-1 bg-transparent text-base font-medium text-slate-800 outline-none placeholder:text-slate-400"
            autoFocus
          />
          <button onClick={onClose} aria-label="Close search" className="p-1 text-slate-400 transition-colors hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {q === "" ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">Search the league</p>
              <p className="mt-1 text-xs text-slate-500">Type a team, city or venue name to find fixtures and results.</p>
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No matches match “{query}”.</p>
          ) : (
            <div className="space-y-2">
              {results.slice(0, 8).map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-2.5 text-left text-xs transition-colors hover:bg-orange-50/50"
                >
                  <span className="font-semibold text-slate-800">
                    {m.teamA.name} vs {m.teamB.name}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {m.status === "completed" ? `${m.teamAScore} - ${m.teamBScore}` : formatMatchDate(m.date)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- About ---------------- */

export function AboutModal({
  isOpen,
  tournament,
  standings,
  teamCount,
  venueCount,
  playerCount,
  onClose,
}: {
  isOpen: boolean;
  tournament: TournamentDto | null;
  standings: StandingsDto | null;
  teamCount: number;
  venueCount: number;
  playerCount: number;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const stats = [
    { value: teamCount, label: "Franchise Teams", tone: "border-orange-100 bg-orange-50 text-pitch-orange-dark" },
    { value: venueCount, label: "Venues", tone: "border-emerald-100 bg-emerald-50 text-[#15803d]" },
    { value: playerCount, label: "Registered Players", tone: "border-blue-100 bg-blue-50 text-[#1d4ed8]" },
  ];

  return (
    <ModalShell onClose={onClose} size="max-w-2xl">
      <ModalHeader
        title="About the League"
        subtitle="Preserving our hockey heritage, inspiring the next generation"
        onClose={onClose}
      />

      <div className="space-y-4 overflow-y-auto p-6 text-sm leading-relaxed text-slate-700">
        <div className="space-y-2">
          <h4 className="text-base font-bold text-navy">Our Mission</h4>
          <p>
            {tournament
              ? `The ${tournament.name} (${tournament.season}) is a ${tournament.format.replace(/_/g, " ")} championship built to elevate field hockey across central India — connecting grassroots talent hubs with modern synthetic turfs and creating a clear pipeline toward state and national teams.`
              : "The Chhattisgarh Hockey League is the premier regional field hockey championship dedicated to elevating the sport across central India."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.tone}`}>
              <span className="block text-2xl font-black">{s.value}</span>
              <span className="text-xs font-semibold text-slate-700">{s.label}</span>
            </div>
          ))}
        </div>

        {standings && standings.rows.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-base font-bold text-navy">Current Table Leaders</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
              {standings.rows.slice(0, 3).map((r) => (
                <li key={r.teamId}>
                  {r.position}. {r.teamName} — {r.points} pts ({r.played} played)
                </li>
              ))}
            </ul>
          </div>
        )}

        {tournament?.rules && (
          <div className="space-y-2 pt-2">
            <h4 className="text-base font-bold text-navy">Tournament Rules</h4>
            <p className="whitespace-pre-line text-xs text-slate-600">{tournament.rules}</p>
          </div>
        )}
      </div>

      <ModalFooter onClose={onClose} />
    </ModalShell>
  );
}

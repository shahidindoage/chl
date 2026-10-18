import type { PlayerDto, TeamWithSponsorsDto } from "@tournament/shared";
import { Facebook, Globe, Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import * as playerApi from "../api/player.client.js";
import * as teamApi from "../api/team.client.js";
import { apiErrorMessage } from "../api/client.js";
import { FollowTeamButton } from "../components/FollowTeamButton.js";

/**
 * Public FE (Module 2 + 3): team profile.
 * Layout follows reference/teampage.png — hero banner with the crest on the
 * right and socials on the left, then a Captain / Coach / Owner strip, then
 * the squad grid.
 */

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

function InfoCard({
  label,
  value,
  image,
  imageAlt,
}: {
  label: string;
  value: string;
  image?: string | null;
  imageAlt?: string;
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-4 shadow-sm">
      <p className="text-sm font-bold text-navy">{label}</p>

      {image && (
        /* object-contain and no fixed square, so the artwork is never cropped
           or squashed - it renders at its original proportions. */
        <img
          src={image}
          alt={imageAlt ?? label}
          title={imageAlt ?? value}
          className="mt-2 h-12 w-full object-contain object-left"
        />
      )}
      {
        label == "Owner" ? <></> : <p className="mt-2 truncate text-sm text-slate-600">{value}</p>
      }
    </div>
  );
}

/**
 * Squad card — reference/playercard.png.
 * The player cut-out deliberately breaks the top edge of the card art, so the
 * art div is clipped but the wrapper is not.
 */
function SquadCard({ player, team }: { player: PlayerDto; team: TeamWithSponsorsDto }) {
  return (
    <div className="group block">
      <div className="relative">
        <div className="h-44 w-full overflow-hidden rounded-lg lg:h-64">
          {team.heroImage ? (
            <img src={team.heroImage} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="block h-full w-full"
              style={{ background: `linear-gradient(160deg, ${team.color1}, ${team.color2 ?? "#0a1128"})` }}
            />
          )}
        </div>

        {player.image ? (
          /* object-cover on a box taller than the card fills the bottom edge
             with no gap, while the overflow above the card is the player's
             head and shoulders. */
          <img
            src={player.image}
            alt={`${player.name}, ${player.position}`}
            className="absolute inset-x-0 bottom-0 h-[10rem] w-full object-cover object-top drop-shadow-md transition-transform duration-300  lg:h-[19rem]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-black text-white/80">
            #{player.jerseyNumber}
          </span>
        )}

        {player.flagImage && (
          <img
            src={player.flagImage}
            alt={player.nationality}
            title={player.nationality}
            className="absolute left-2 top-6 h-6 w-6 rounded-full object-cover ring-2 ring-white"
          />
        )}
      </div>

      <p className="mt-2 font-display text-base font-extrabold text-navy group-hover:text-pitch-orange-dark">
        {player.name}
      </p>
      <p className="text-sm text-slate-500">{player.position}</p>
    </div>
  );
}

type TeamTab = "overview" | "squad";

export function TeamProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<TeamWithSponsorsDto | null>(null);
  const [squad, setSquad] = useState<PlayerDto[]>([]);
  const [tab, setTab] = useState<TeamTab>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // A different team means a different squad - reset the tab so the user
    // never lands on an empty "Squad" tab from the previous team.
    setTab("overview");
    teamApi.getTeam(id).then(setTeam).catch((err) => setError(apiErrorMessage(err)));
    playerApi.listPlayers({ page: 1, limit: 100, teamId: id })
      .then((d) => setSquad(d.items))
      .catch(() => undefined);
  }, [id]);

  if (error) return <p className="alert-error">{error}</p>;
  if (!team) return <p className="text-slate-400">Loading team…</p>;

  /* One player per position, capped at 4 so the grid stays full. A team with
     only two positions filled shows two cards rather than padding with
     duplicates. */
  const preview = (["forward", "midfielder", "defender", "goalkeeper"] as const)
    .map((position) => squad.find((p) => p.position === position))
    .filter((p): p is PlayerDto => p !== undefined);

  const socials = [
    { href: team.websiteUrl, label: "Website", Icon: Globe },
    { href: team.facebookUrl, label: "Facebook", Icon: Facebook },
    { href: team.instagramUrl, label: "Instagram", Icon: Instagram },
    { href: team.xUrl, label: "X", Icon: XIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof Globe } => Boolean(s.href));

  return (
    <div>
      {/* Hero banner — team art, or colour1 when no banner is set. Rounded so it
          reads as a card rather than a full-bleed block. */}
      <div
        className="relative mx-4 mt-4 overflow-hidden rounded-2xl sm:mx-6 sm:mt-6"
        style={{
          backgroundImage: team.heroImage ? `url(${team.heroImage})` : undefined,
          backgroundColor: team.color1,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-12 sm:px-6">
          <div className="min-w-0">
            {/* <PageHeroSpacer /> */}
            <h1 className="font-display text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
              {team.name}
            </h1>
            {/* <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-white/80">
              {team.shortName}
            </p> */}

            {socials.length > 0 && (
              <div className="mt-4 flex gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="rounded-full p-2 text-white transition-colors hover:bg-black/20"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}

            <div className="mt-5">
              <FollowTeamButton teamId={team.id} teamName={team.shortName} color1={team.color1} />
            </div>
          </div>

          {team.logo && (
            <div
              className="hidden h-44 w-44 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white/95 p-3 shadow-2xl sm:flex"
              style={{ borderColor: team.color1 }}
            >
              <img src={team.logo} alt={`${team.name} logo`} className="h-full w-full object-contain" />
            </div>
          )}
        </div>

        {/* Tab strip sits inside the hero — Color 2 background with a Color 1
            rule along its top edge, as in reference/teampage.png. */}
        <div
          className="border-t-4"
          style={{ backgroundColor: team.color2 ?? "#0a1128", borderTopColor: team.color1 }}
        >
          <div className="mx-auto flex max-w-6xl gap-8 px-4 sm:px-6">
            {(["overview", "squad"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`-mb-px border-b-2 py-3 text-sm font-semibold capitalize transition-colors ${
                  tab === key
                    ? "border-pitch-orange text-white"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {key}
              
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {tab === "overview" ? (
          <>
            {/* Captain / Coach / Owner strip. Sits below the tab bar, never
                overlapping the hero. */}
            <div className="grid gap-3 pt-8 sm:grid-cols-3">
              <InfoCard label="Captain" value={team.captain?.name ?? "—"} />
              <InfoCard label="Coach" value={team.coachName ?? "—"} />
              <InfoCard
                label="Owner"
                value={team.ownerName ?? (team.ownerId ? "Registered owner" : "—")}
                image={team.ownerImage}
                imageAlt={team.ownerName ?? "Team owner"}
              />
            </div>

            {/* Squad preview — one player per position, so the four cards
                always show a spread of the team rather than 4 midfielders.
                The Squad tab has the full list. */}
            <div className="py-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-extrabold text-navy pb-6">Squad</h2>
                {squad.length > preview.length && (
                  <button
                    type="button"
                    onClick={() => setTab("squad")}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    More
                  </button>
                )}
              </div>

              {squad.length === 0 ? (
                <p className="text-sm text-slate-400">No players registered yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {preview.map((p) => (
                    <SquadCard key={p.id} player={p} team={team} />
                  ))}
                </div>
              )}
            </div>

            {/* Sponsors */}
            {/* <div className="pb-10">
              <h2 className="mb-4 font-display text-2xl font-extrabold text-navy">Sponsors</h2>
              {team.sponsors.length === 0 ? (
                <p className="text-sm text-slate-400">No sponsors yet.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {team.sponsors.map((s) => (
                    <span key={s.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
                      {s.logo && <img src={s.logo} alt="" className="h-4 w-4 object-contain" />}
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div> */}
          </>
        ) : (
          /* Squad tab — players grouped by position, in pitch order. */
          <div className="py-10">
            {/* <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold text-navy">Squad</h2>
              <span className="text-sm text-slate-400">
                {squad.length} {squad.length === 1 ? "player" : "players"}
              </span>
            </div> */}

            {squad.length === 0 ? (
              <p className="text-sm text-slate-400">No players registered yet.</p>
            ) : (
              <div className="space-y-10">
                {/* Forwards first, then working backwards to the goalkeeper. */}
                {(["forward", "midfielder", "defender", "goalkeeper"] as const).map((position) => {
                  const group = squad.filter((p) => p.position === position);
                  if (group.length === 0) return null;
                  return (
                    <section key={position}>
                      <div className="mb-4 flex items-baseline gap-3">
                        <h3 className="font-display text-2xl font-extrabold text-navy pb-6">
                          {/* "goalkeeper" is already singular - no trailing s. */}
                          {position === "goalkeeper" ? "Goalkeeper" : `${position}s`}
                        </h3>
                      
                      </div>
                      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                        {group.map((p) => (
                          <SquadCard key={p.id} player={p} team={team} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
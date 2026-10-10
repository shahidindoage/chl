import type { TeamDto } from "@tournament/shared";
import { Link } from "react-router-dom";

/**
 * Public team card — reference/teamcard.png.
 *
 * A card-sized plate of the team's background art, with the crest centred
 * inside a ring. The ring uses the team's Color 2 when set, otherwise Color 1,
 * so a team without a second colour still gets a defined border.
 */
export function TeamCard({ team }: { team: TeamDto }) {
  const ring = team.color1 ?? team.color2;

  return (
    <Link
      to={`/teams/${team.id}`}
      className="group relative block overflow-hidden rounded-2xl ring-1 ring-black/5 transition-shadow duration-200 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pitch-orange"
    >
      {/* Card art: the team's own background image, else a colour-derived
          gradient so the plate is never blank. */}
      {team.backgroundImage ? (
        <img
          src={team.backgroundImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${team.color1}cc, ${team.color1}66 45%, #0a1128 100%)`,
          }}
        />
      )}

      <div className="relative flex h-full min-h-[18rem] flex-col items-center justify-center px-5 py-8 text-center">
        <div
          className="flex h-44 w-44 items-center justify-center rounded-full border-[6px] bg-[#f5f0e6] shadow-2xl transition-transform duration-300 group-hover:scale-105"
          style={{ borderColor: ring }}
        >
          {team.logo ? (
            <img src={team.logo} alt={`${team.name} logo`} className="h-36 w-36 object-contain" />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center font-display text-3xl font-black"
              style={{ color: team.color1 }}
            >
              {team.shortName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
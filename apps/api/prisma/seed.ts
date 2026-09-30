/**
 * Seed for Module 9 (Auth). Later modules extend this file with a full
 * sample tournament/teams/players/matches dataset (Section 9).
 *
 * Goes through the auth module's service (Section 2 rule 2: nothing but
 * the auth repository touches prisma.User directly — not even the seed).
 *
 * Dev convenience: when SMTP_HOST is unset, auth.service logs OTP codes
 * to the console instead of emailing them.
 */
import { logger } from "../src/core/lib/logger.js";
import { prisma } from "../src/core/lib/prisma.js";
import { redis } from "../src/core/lib/redis.js";
import { ensureUser } from "../src/modules/auth/auth.service.js";
import { createTournament, createVenue, listTournaments, listVenues, updateTournament } from "../src/modules/tournament/tournament.service.js";
import { createTeam, listTeams } from "../src/modules/team/team.service.js";
import { createPlayer, listPlayers } from "../src/modules/player/player.service.js";
import { addEvent, createMatch, listMatches, updateResult } from "../src/modules/match/match.service.js";
import { findUserByEmailSafe } from "../src/modules/auth/auth.service.js";

async function main(): Promise<void> {
  const users = [
    { email: "superadmin@tournament.local", name: "Super Admin", role: "super_admin" as const, password: "Admin#12345" },
    { email: "owner@tournament.local", name: "Team Owner", role: "team_owner" as const, password: "Owner#12345" },
    { email: "content@tournament.local", name: "Content Manager", role: "content_manager" as const, password: "Content#12345" },
    { email: "scores@tournament.local", name: "Score Manager", role: "score_manager" as const, password: "Scores#12345" },
    { email: "quiz@tournament.local", name: "Quiz Manager", role: "quiz_manager" as const, password: "Quiz#12345" },
    { email: "fan@tournament.local", name: "Sample Fan", role: "fan" as const, password: "Fan#12345" },
  ];

  for (const user of users) {
    const created = await ensureUser(user);
    logger.info(`seeded user ${created.email} (role=${user.role})`);
  }

  // Module 1 — sample tournament + venues
  const existingTournaments = await listTournaments({ page: 1, limit: 1 });
  let tournamentId: string | null = null;
  if (existingTournaments.pagination.total === 0) {
    const tournament = await createTournament({
      name: "Winter Cup",
      season: "2026",
      format: "league",
      rules: "Double round-robin group stage. Win = 3 pts, draw = 1 pt. Tie-break: goal difference, then goals scored. Top 4 advance to knockouts.",
      startDate: new Date("2026-11-01T00:00:00Z"),
      endDate: new Date("2026-12-20T00:00:00Z"),
      status: "upcoming",
      isActive: true,
    });
    tournamentId = tournament.id;
    logger.info(`seeded tournament ${tournament.name} ${tournament.season} (active)`);
  } else {
    tournamentId = existingTournaments.items[0]!.id;
  }

  const existingVenues = await listVenues({ page: 1, limit: 1 });
  if (existingVenues.pagination.total === 0) {
    for (const venue of [
      { name: "Olympia Stadium", address: "Marina Beach Road", city: "Chennai", capacity: 12000 },
      { name: "City Arena", address: "Park Street", city: "Kolkata", capacity: 8000 },
      { name: "Fort Grounds", address: "MG Road", city: "Bengaluru", capacity: 10000 },
    ]) {
      await createVenue(venue);
      logger.info(`seeded venue ${venue.name} (${venue.city})`);
    }
  }

  // Module 2 — sample teams (idempotent: only when no teams exist yet)
  const existingTeams = await listTeams({ page: 1, limit: 1 });
  if (existingTeams.pagination.total === 0 && tournamentId) {
    const systemActor = { id: "seed", role: "super_admin" as const };
    const ownerUser = await findUserByEmailSafe("owner@tournament.local");
    const ownerActor = ownerUser ? { id: ownerUser.id, role: "team_owner" as const } : systemActor;

    const teams = [
      {
        actor: systemActor,
        input: { name: "Winter Kings", shortName: "WNK", logo: null, color1: "#1a5fb4", color2: "#f66151", tournamentId, coachName: "Alex Fisher", coachImage: null, ownerId: null },
      },
      {
        actor: systemActor,
        input: { name: "Ice Breakers", shortName: "ICE", logo: null, color1: "#26a26b", color2: null, tournamentId, coachName: "Priya Nair", coachImage: null, ownerId: null },
      },
      {
        actor: ownerActor,
        input: { name: "Storm Riders", shortName: "STR", logo: null, color1: "#e5a50a", color2: "#1c1c1c", tournamentId, coachName: "Sam Coach", coachImage: null, ownerId: ownerUser?.id ?? null },
      },
    ];
    for (const { actor, input } of teams) {
      const team = await createTeam(input, actor);
      logger.info(`seeded team ${team.name} (${team.shortName})`);
    }
  }

  // Module 3 — sample players (idempotent: only when no players exist yet)
  const existingPlayers = await listPlayers({ page: 1, limit: 1 });
  if (existingPlayers.pagination.total === 0 && tournamentId) {
    const seededTeams = (await listTeams({ page: 1, limit: 50, tournamentId })).items;
    const byShort = new Map(seededTeams.map((t) => [t.shortName, t.id]));
    const systemActor = { id: "seed", role: "super_admin" as const };

    const roster: Array<[string, number, "goalkeeper" | "defender" | "midfielder" | "forward", string, string, string]> = [
      // teamShort, jersey, position, name, dob, nationality
      ["WNK", 1, "goalkeeper", "Dev Anand", "1995-04-12", "India"],
      ["WNK", 4, "defender", "Rohan Mehta", "1997-09-21", "India"],
      ["WNK", 10, "midfielder", "Liam Carter", "1993-02-08", "Australia"],
      ["WNK", 11, "forward", "Arjun Rao", "1999-06-30", "India"],
      ["ICE", 1, "goalkeeper", "Sameer Khan", "1996-12-02", "India"],
      ["ICE", 7, "midfielder", "Nikhil Verma", "1998-03-17", "India"],
      ["ICE", 9, "forward", "Tom Bradley", "1994-07-25", "Great Britain"],
      ["STR", 1, "goalkeeper", "Ishaan Gupta", "1997-01-14", "India"],
      ["STR", 5, "defender", "Marcus Reed", "1992-11-05", "Canada"],
      ["STR", 8, "midfielder", "Aryan Shah", "2000-08-19", "India"],
      ["STR", 99, "forward", "Karan Malhotra", "1995-05-27", "India"],
    ];

    for (const [teamShort, jersey, position, name, dob, nationality] of roster) {
      const teamId = byShort.get(teamShort);
      if (!teamId) continue;
      await createPlayer(
        { name, image: null, jerseyNumber: jersey, position, dateOfBirth: dob, nationality, teamId },
        systemActor
      );
    }
    logger.info(`seeded ${roster.length} players across ${byShort.size} teams`);
  }

  // Module 4 — sample matches (idempotent: only when none exist yet).
  // Dates are relative to "now" so the homepage Next/Recent both fill.
  const existingMatches = await listMatches({ page: 1, limit: 1 });
  if (existingMatches.pagination.total === 0 && tournamentId) {
    const seededTeams = (await listTeams({ page: 1, limit: 50, tournamentId })).items;
    const byShort = new Map(seededTeams.map((t) => [t.shortName, t.id]));
    const playersByTeam = await listPlayers({ page: 1, limit: 100 });
    const venues = (await listVenues({ page: 1, limit: 10 })).items;
    const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString();
    const idOf = (s: string) => byShort.get(s);

    const fixtures: Array<{ a: string; b: string; offset: number; score?: [number, number]; venueIdx: number }> = [
      { a: "WNK", b: "ICE", offset: -9, score: [3, 1], venueIdx: 0 },
      { a: "ICE", b: "STR", offset: -5, score: [2, 2], venueIdx: 1 },
      { a: "STR", b: "WNK", offset: -1, score: [0, 1], venueIdx: 2 },
      { a: "WNK", b: "STR", offset: 3, venueIdx: 0 },
      { a: "STR", b: "ICE", offset: 7, venueIdx: 1 },
      { a: "ICE", b: "WNK", offset: 12, venueIdx: 2 },
    ];

    for (const f of fixtures) {
      const teamAId = idOf(f.a);
      const teamBId = idOf(f.b);
      if (!teamAId || !teamBId) continue;
      const venueId = venues[f.venueIdx % venues.length]?.id ?? null;
      const match = await createMatch({ tournamentId, teamAId, teamBId, venueId, date: day(f.offset), status: "upcoming" });
      if (f.score) {
        await updateResult(match.id, { teamAScore: f.score[0], teamBScore: f.score[1], summary: `${f.a} ${f.score[0]}–${f.score[1]} ${f.b}` });
        const scorer = playersByTeam.items.find((p) => p.teamId === teamAId && p.position === "forward");
        if (f.score[0] > 0) {
          await addEvent(match.id, {
            eventType: "goal",
            teamId: teamAId,
            playerId: scorer?.id ?? null,
            minute: 12,
            description: "Opening goal",
          });
        }
      }
    }
    logger.info(`seeded ${fixtures.length} matches (${fixtures.filter((f) => f.score).length} with results)`);
  }

  // Ensure exactly one active tournament in dev data
  const all = await listTournaments({ page: 1, limit: 50 });
  const active = all.items.filter((t) => t.isActive);
  for (const stale of active.slice(1)) {
    await updateTournament(stale.id, {
      name: stale.name,
      season: stale.season,
      format: stale.format,
      rules: stale.rules,
      startDate: stale.startDate,
      endDate: stale.endDate,
      status: stale.status,
      logo: stale.logo,
      isActive: false,
    });
  }
}

main()
  .catch((error) => {
    logger.error("seed failed", { message: (error as Error).message, stack: (error as Error).stack });
    process.exitCode = 1;
  })
  .finally(async () => {
    // Match writes lazily open the Redis client (standings invalidation) —
    // force-disconnect both pools or the process never exits. (quit() hangs
    // when the lazy client never reached "ready".)
    await prisma.$disconnect();
    redis.disconnect();
  });

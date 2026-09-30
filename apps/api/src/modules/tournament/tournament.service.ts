import type { Tournament, Venue } from "@prisma/client";

import { ApiError } from "../../core/utils/ApiError.js";
import * as repo from "./tournament.repository.js";
import type {
  CreateTournamentInput,
  CreateVenueInput,
  ListTournamentsQuery,
  ListVenuesQuery,
  TournamentDto,
  UpdateTournamentInput,
  UpdateVenueInput,
  VenueDto,
} from "@tournament/shared";

type TournamentRow = Tournament;
type VenueRow = Venue;

function toTournamentDto(t: TournamentRow): TournamentDto {
  return {
    id: t.id,
    name: t.name,
    season: t.season,
    format: t.format,
    rules: t.rules,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    status: t.status,
    logo: t.logo,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function toVenueDto(v: VenueRow): VenueDto {
  return {
    id: v.id,
    name: v.name,
    address: v.address,
    city: v.city,
    capacity: v.capacity,
    image: v.image,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Section 8 flow: super_admin creates a tournament → it becomes the parent
 * container for everything created after it. Exactly one can be active.
 */
export async function createTournament(input: CreateTournamentInput): Promise<TournamentDto> {
  const clash = await repo.findTournamentBySeasonName(input.season, input.name);
  if (clash) throw ApiError.conflict(`A tournament "${input.name}" already exists in season ${input.season}`);

  let created: TournamentRow;
  try {
    created = await repo.createTournament({
      name: input.name,
      season: input.season,
      format: input.format,
      rules: input.rules ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      logo: input.logo ?? null,
      isActive: false,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict("Tournament with the same season and name already exists");
    }
    throw error;
  }

  if (input.isActive) {
    await repo.setActiveTournament(created.id);
    created = (await repo.findTournamentById(created.id)) as TournamentRow;
  }
  return toTournamentDto(created);
}

export async function updateTournament(id: string, input: UpdateTournamentInput): Promise<TournamentDto> {
  const existing = await repo.findTournamentById(id);
  if (!existing) throw ApiError.notFound("Tournament not found");

  const clash = await repo.findTournamentBySeasonName(input.season, input.name);
  if (clash && clash.id !== id) {
    throw ApiError.conflict(`A tournament "${input.name}" already exists in season ${input.season}`);
  }

  let updated: TournamentRow = await repo.updateTournament(id, {
    name: input.name,
    season: input.season,
    format: input.format,
    rules: input.rules ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    logo: input.logo ?? null,
    isActive: existing.isActive && input.isActive, // turning ON is handled below
  });

  if (input.isActive && !existing.isActive) {
    await repo.setActiveTournament(id);
    updated = (await repo.findTournamentById(id)) as TournamentRow;
  }
  return toTournamentDto(updated);
}

export async function deleteTournament(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findTournamentById(id);
  if (!existing) throw ApiError.notFound("Tournament not found");
  if (existing.isActive) {
    throw ApiError.badRequest("Deactivate this tournament before deleting it — the active tournament is the container for teams/matches");
  }
  await repo.deleteTournament(id);
  return { deleted: true, id };
}

export async function getTournament(id: string): Promise<TournamentDto> {
  const found = await repo.findTournamentById(id);
  if (!found) throw ApiError.notFound("Tournament not found");
  return toTournamentDto(found);
}

export async function getActiveTournament(): Promise<TournamentDto | null> {
  const active = await repo.findActiveTournament();
  return active ? toTournamentDto(active) : null;
}

export async function listTournaments(query: ListTournamentsQuery): Promise<{
  items: TournamentDto[];
  pagination: ReturnType<typeof pagination>;
}> {
  const { items, total } = await repo.listTournaments({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    ...(query.status ? { status: query.status } : {}),
  });
  return { items: items.map(toTournamentDto), pagination: pagination(query.page, query.limit, total) };
}

export async function createVenue(input: CreateVenueInput): Promise<VenueDto> {
  const created = await repo.createVenue({
    name: input.name,
    address: input.address,
    city: input.city,
    capacity: input.capacity ?? null,
    image: input.image ?? null,
  });
  return toVenueDto(created);
}

export async function updateVenue(id: string, input: UpdateVenueInput): Promise<VenueDto> {
  const existing = await repo.findVenueById(id);
  if (!existing) throw ApiError.notFound("Venue not found");
  const updated = await repo.updateVenue(id, {
    name: input.name,
    address: input.address,
    city: input.city,
    capacity: input.capacity ?? null,
    image: input.image ?? null,
  });
  return toVenueDto(updated);
}

export async function deleteVenue(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findVenueById(id);
  if (!existing) throw ApiError.notFound("Venue not found");
  await repo.deleteVenue(id);
  return { deleted: true, id };
}

export async function getVenue(id: string): Promise<VenueDto> {
  const found = await repo.findVenueById(id);
  if (!found) throw ApiError.notFound("Venue not found");
  return toVenueDto(found);
}

export async function listVenues(query: ListVenuesQuery): Promise<{
  items: VenueDto[];
  pagination: ReturnType<typeof pagination>;
}> {
  const { items, total } = await repo.listVenues({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    ...(query.city ? { city: query.city } : {}),
  });
  return { items: items.map(toVenueDto), pagination: pagination(query.page, query.limit, total) };
}

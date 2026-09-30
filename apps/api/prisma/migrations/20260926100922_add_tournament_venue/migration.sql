-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('league', 'knockout', 'group_knockout');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "Tournament" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "format" "TournamentFormat" NOT NULL DEFAULT 'league',
    "rules" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "capacity" INTEGER,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");

-- CreateIndex
CREATE INDEX "Tournament_isActive_idx" ON "Tournament"("isActive");

-- CreateIndex
CREATE INDEX "Tournament_startDate_idx" ON "Tournament"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_season_name_key" ON "Tournament"("season", "name");

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "Venue"("city");

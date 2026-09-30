-- CreateEnum
CREATE TYPE "CommentaryType" AS ENUM ('goal', 'penalty', 'card', 'substitution', 'period', 'injury', 'info', 'other');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Commentary" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "minute" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" "CommentaryType" NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commentary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commentary_matchId_idx" ON "Commentary"("matchId");

-- CreateIndex
CREATE INDEX "Commentary_matchId_minute_idx" ON "Commentary"("matchId", "minute");

-- AddForeignKey
ALTER TABLE "Commentary" ADD CONSTRAINT "Commentary_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

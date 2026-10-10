-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "backgroundImage" TEXT,
ADD COLUMN     "flagImage" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "captainId" UUID,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "xUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

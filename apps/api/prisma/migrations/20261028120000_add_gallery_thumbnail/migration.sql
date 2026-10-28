-- Optional cover image for the public gallery index. Null means "use the
-- first image in the gallery".
ALTER TABLE "Gallery" ADD COLUMN "thumbnailUrl" TEXT;

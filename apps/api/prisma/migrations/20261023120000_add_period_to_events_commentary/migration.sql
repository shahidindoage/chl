-- Events and commentary gain a period label so a flat timeline can tell
-- "2nd · 12'" apart from "4th · 12'". Nullable: existing rows keep working
-- and the UI falls back to minute-only.
ALTER TABLE "MatchEvent" ADD COLUMN "period" TEXT;
ALTER TABLE "Commentary" ADD COLUMN "period" TEXT;

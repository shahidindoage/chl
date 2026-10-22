-- AlterEnum
-- Adds the "To Be Confirmed" position for squad members whose role is not
-- decided yet. Stored as "tbc" so it filters and sorts like any other value.
ALTER TYPE "PlayerPosition" ADD VALUE 'tbc';

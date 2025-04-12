-- Add source and destination columns to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "source" varchar;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "destination" varchar; 
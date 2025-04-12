-- Add status column to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'active'; 
-- Add invite_first_name and invite_last_name columns to event_members
ALTER TABLE "event_members" 
ADD COLUMN IF NOT EXISTS "invite_first_name" varchar,
ADD COLUMN IF NOT EXISTS "invite_last_name" varchar;

-- Update journal with this migration
INSERT INTO "_migrations" ("id", "name", "hash", "executed_at")
VALUES ('0007', 'add_invite_names', 'manual-migration', now())
ON CONFLICT DO NOTHING; 
-- Create invite_status enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
        CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
    END IF;
END $$;

-- Create event_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS "event_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "role" role DEFAULT 'member',
  "invite_status" invite_status DEFAULT 'pending',
  "invite_token" varchar,
  "invite_email" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
); 
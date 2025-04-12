-- Add status column to items table
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'not_started';

-- Update the status based on isPacked
UPDATE "items" SET "status" = 
  CASE 
    WHEN "is_packed" = true THEN 'packed'
    ELSE 'not_started'
  END; 
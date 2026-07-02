-- IncogniCare: Add missing OAuth columns to User table
-- Run this in Supabase Dashboard → SQL Editor → New Query

-- Add googleId column if it doesn't exist
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- Add appleId column if it doesn't exist
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "appleId" TEXT;

-- Add unique constraints (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_googleId_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_googleId_key" UNIQUE ("googleId");
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_appleId_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_appleId_key" UNIQUE ("appleId");
  END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;

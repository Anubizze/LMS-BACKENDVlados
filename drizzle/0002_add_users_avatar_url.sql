-- Add avatar_url to users table (optional, for profile picture URL)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500);

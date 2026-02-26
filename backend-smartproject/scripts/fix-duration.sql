-- Add duration column to project_activities (safe to run multiple times)
-- Run on DigitalOcean: psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" -f fix-duration.sql

BEGIN;

ALTER TABLE project_activities
ADD COLUMN IF NOT EXISTS duration integer;

COMMIT;

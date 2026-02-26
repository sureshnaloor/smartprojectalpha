-- Run as database superuser or current table owner (e.g. doadmin on DigitalOcean).
-- Fixes ownership so your app user can alter the table, then adds the column.
--
-- 1. Replace your_app_db_user with the username from your DATABASE_URL (e.g. doadmin or custom user).
-- 2. If the username is mixed-case, use double quotes: OWNER TO "YourAppUser".

BEGIN;

-- Make app user the owner (run as table owner or superuser)
ALTER TABLE project_activities OWNER TO your_app_db_user;

-- Add duration column
ALTER TABLE project_activities
ADD COLUMN IF NOT EXISTS duration integer;

COMMIT;

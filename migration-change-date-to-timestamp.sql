-- Migration to change date columns from DATE to TIMESTAMP
-- This allows storing both date and time information in the date column

-- Update expenses table
-- First, add a new timestamp column
ALTER TABLE expenses ADD COLUMN date_timestamp TIMESTAMP WITH TIME ZONE;

-- Copy existing date data to the new timestamp column (set time to 00:00:00)
UPDATE expenses SET date_timestamp = date::timestamp AT TIME ZONE 'UTC';

-- Drop the old date column
ALTER TABLE expenses DROP COLUMN date;

-- Rename the new column to date
ALTER TABLE expenses RENAME COLUMN date_timestamp TO date;

-- Make the date column NOT NULL
ALTER TABLE expenses ALTER COLUMN date SET NOT NULL;

-- Update income table
-- First, add a new timestamp column
ALTER TABLE income ADD COLUMN date_timestamp TIMESTAMP WITH TIME ZONE;

-- Copy existing date data to the new timestamp column (set time to 00:00:00)
UPDATE income SET date_timestamp = date::timestamp AT TIME ZONE 'UTC';

-- Drop the old date column
ALTER TABLE income DROP COLUMN date;

-- Rename the new column to date
ALTER TABLE income RENAME COLUMN date_timestamp TO date;

-- Make the date column NOT NULL
ALTER TABLE income ALTER COLUMN date SET NOT NULL;

-- Update indexes to work with the new timestamp column
DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_expenses_user_date;
DROP INDEX IF EXISTS idx_income_date;
DROP INDEX IF EXISTS idx_income_user_date;

-- Recreate indexes for the timestamp column
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date);

-- Fix recurring_frequency constraint to allow NULL values
-- This migration updates the existing constraint to allow NULL values for recurring_frequency
-- when is_recurring is false

-- Drop the existing constraint
ALTER TABLE income DROP CONSTRAINT IF EXISTS income_recurring_frequency_check;

-- Add the new constraint that allows NULL values
ALTER TABLE income ADD CONSTRAINT income_recurring_frequency_check 
  CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('monthly', 'mid_month', 'end_month', 'yearly'));

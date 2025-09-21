-- Migration: Add currency field to expenses table
-- Run this in your Supabase SQL Editor

-- Add currency column to expenses table
ALTER TABLE expenses 
ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'PHP' 
CHECK (currency_code IN ('PHP', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency_code);

-- Update existing records to have PHP as default currency
UPDATE expenses SET currency_code = 'PHP' WHERE currency_code IS NULL;

-- Make currency_code NOT NULL (remove default after setting existing records)
ALTER TABLE expenses ALTER COLUMN currency_code DROP DEFAULT;

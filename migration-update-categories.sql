-- Migration to update the category constraint to allow new categories
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

-- Add the new constraint with all the new categories
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check 
CHECK (category IN (
  'transportation', 
  'food', 
  'bills', 
  'entertainment', 
  'shopping', 
  'healthcare', 
  'education', 
  'travel', 
  'groceries', 
  'utilities', 
  'others'
));



-- Migration to add quick amounts table
-- Run this in your Supabase SQL editor

-- Create quick_amounts table
CREATE TABLE IF NOT EXISTS quick_amounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('transportation', 'food', 'bills', 'entertainment', 'shopping', 'healthcare', 'education', 'travel', 'groceries', 'utilities', 'others')),
  amount DECIMAL(10,2) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'PHP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quick_amounts_user_id ON quick_amounts(user_id);

-- Enable Row Level Security
ALTER TABLE quick_amounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quick amounts" ON quick_amounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quick amounts" ON quick_amounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick amounts" ON quick_amounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick amounts" ON quick_amounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_quick_amounts_updated_at
  BEFORE UPDATE ON quick_amounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

/*
  # Create profiles table

  1. New Tables
    - `profiles` table to store user profile information
      - `id` (uuid, primary key) - references auth.users.id
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `website` (text, nullable)
      - `bio` (text, nullable)
      
  2. Security
    - Enable Row Level Security (RLS) on profiles table
    - Add policies for authenticated users to read and update their own profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Allow users to insert their own profile (for initial profile creation)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
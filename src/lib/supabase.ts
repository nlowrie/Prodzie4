import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Anon Key is missing. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);
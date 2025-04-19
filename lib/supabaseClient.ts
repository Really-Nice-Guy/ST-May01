import { createClient } from '@supabase/supabase-js';

// Ensure the Supabase client is initialized
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default supabase; 
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_KEY;

const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_SECRET_KEY;

if (serviceRoleKey) {
  throw new Error('CRITICAL SECURITY ERROR: Service role key should never be exposed to the frontend.');
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or Publishable Key in frontend/.env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
export default supabase;

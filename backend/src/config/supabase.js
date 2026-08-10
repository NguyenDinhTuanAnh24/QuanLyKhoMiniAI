require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL in backend/.env');
}

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY in backend/.env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

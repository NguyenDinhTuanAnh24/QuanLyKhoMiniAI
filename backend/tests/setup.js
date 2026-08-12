require('dotenv').config({ path: '.env.test' }); // Fallback or override for tests if needed
const { createClient } = require('@supabase/supabase-js');

// Helper to get supabase test client
const getTestSupabase = () => {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
};

module.exports = { getTestSupabase };

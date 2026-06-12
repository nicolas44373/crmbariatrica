const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Querying pg_policies...');
  // We can try to query pg_catalog.pg_policies via a select, but pg_policies is a system table, PostgREST might not expose it.
  const { data, error } = await supabase.from('pg_policies').select('*').limit(5);
  if (error) {
    console.error('Failed to query pg_policies directly:', error.message);
  } else {
    console.log('pg_policies:', data);
  }
}

run();

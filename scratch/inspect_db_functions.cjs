const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Querying pg_proc...');
  // We can query pg_catalog tables via .from() if they are exposed, or if there is a view.
  // By default, only public schema tables are exposed, but let's try.
  const { data, error } = await supabase.from('pg_proc').select('*').limit(5);
  if (error) {
    console.error('Failed to query pg_proc directly:', error.message);
  } else {
    console.log('pg_proc sample:', data);
  }
}

run();

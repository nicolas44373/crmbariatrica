const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryTriggers() {
  console.log('Querying triggers via REST API...');
  // PostgREST allows querying any table if it's exposed. Let's see if we can query pg_trigger or information_schema.triggers.
  // We can try to query a RPC if there's any.
  // We can also check if we can execute SQL through Postgres.
  
  // Try querying information_schema.triggers
  const { data, error } = await supabase
    .from('triggers') // this will query public.triggers by default, which won't exist.
    .select('*');

  if (error) {
    console.log('Error querying public.triggers (expected):', error.message);
  }

  // Let's see if we can fetch all functions/RPCs defined on the REST API.
  // PostgREST exposes API schema at the root URL (GET https://.../)
  // Let's fetch the OpenAPI spec of the Supabase project!
  // The OpenAPI spec lists all exposed tables, views, and RPC functions!
  // This is a standard feature of PostgREST and is ALWAYS enabled and public!
  console.log('\nFetching OpenAPI specification from Supabase...');
  try {
    const res = await fetch(supabaseUrl, {
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    const schema = await res.json();
    console.log('Exposed tables/views:', Object.keys(schema.definitions || {}));
    console.log('Exposed paths/RPCs:', Object.keys(schema.paths || {}));
  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err.message);
  }
}

queryTriggers();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryDefault() {
  console.log('Querying column default for pacientes.id_paciente...');
  
  // Since we don't have direct SQL execution, let's try to query pg_catalog tables via PostgREST
  // In some Supabase setups, pg_catalog is not exposed, but sometimes we can access it or there's an RPC.
  // Let's try to fetch using the REST interface.
  const { data, error } = await supabase
    .from('pg_attribute')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Cannot access pg_catalog.pg_attribute directly:', error.message);
  } else {
    console.log('Successfully accessed pg_catalog.pg_attribute!');
  }
}

queryDefault();

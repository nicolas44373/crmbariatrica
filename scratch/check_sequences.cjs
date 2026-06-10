const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Querying pg_sequences...');
  const { data: data1, error: err1 } = await supabase.from('pg_sequences').select('*').limit(20);
  if (err1) {
    console.log('Error pg_sequences:', err1.message);
  } else {
    console.log('pg_sequences results:', data1);
  }

  console.log('Querying information_schema.sequences...');
  const { data: data2, error: err2 } = await supabase.from('sequences').select('*').limit(20);
  if (err2) {
    console.log('Error sequences:', err2.message);
  } else {
    console.log('sequences results:', data2);
  }
}

run();

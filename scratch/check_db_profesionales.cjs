const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('profesionales').select('email, nombres, apellido, iniciales');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Database Professionals:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();

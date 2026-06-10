const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countExact() {
  const { count, error } = await supabase
    .from('evoluciones')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error counting:', error.message);
  } else {
    console.log(`Exact row count of evoluciones table: ${count}`);
  }
}

countExact();

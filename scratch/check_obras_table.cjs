const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  // Query configuracion_sistema
  const { data: config, error: configError } = await supabase.from('configuracion_sistema').select('*');
  console.log('configuracion_sistema:', JSON.stringify(config, null, 2));

  // Let's check if we can query standard schemas or lists of tables
  // By trying to query from a hypothetical 'obras_sociales' table
  const { data: obras, error: obrasError } = await supabase.from('obras_sociales').select('*');
  if (obrasError) {
    console.log('obras_sociales table does not exist or error:', obrasError.message);
  } else {
    console.log('obras_sociales table exists! Rows:', obras.length);
  }
}

checkTables();

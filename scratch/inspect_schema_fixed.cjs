const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  const tables = [
    'pacientes',
    'profesionales',
    'turnos',
    'evoluciones',
    'historias_clinicas',
    'cirugias',
    'carpetas_quirurgicas'
  ];

  for (const table of tables) {
    console.log(`\nTabla: ${table}`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]).join(', '));
    } else {
      console.log('Empty table');
    }
  }
}

inspectSchema();

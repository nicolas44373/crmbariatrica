const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  const tables = [
    'profesionales',
    'pacientes',
    'crm_contactos',
    'historias_clinicas',
    'evoluciones',
    'turnos',
    'cirugias',
    'nutricion_info',
    'psicologia_info',
    'carpetas_quirurgicas',
    'tareas',
    'estudios',
    'informes'
  ];

  console.log('--- Database Table Counts (Exact) ---');
  for (const table of tables) {
    // To get exact count, we can do a select with head: true, count: 'exact'
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`${table}: Error - ${error.message}`);
    } else {
      console.log(`${table}: ${count} rows`);
    }
  }
}

run();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log('Connecting to Supabase at:', supabaseUrl);

  const tables = [
    'pacientes',
    'profesionales',
    'turnos',
    'evoluciones',
    'historias_clinicas',
    'estudios',
    'informes',
    'cirugias',
    'nutricion_info',
    'psicologia_info',
    'crm_contactos',
    'tareas',
    'carpetas_quirurgicas',
    'configuracion_sistema'
  ];

  for (const table of tables) {
    console.log(`\n-----------------------------------------`);
    console.log(`Tabla: ${table}`);
    console.log(`-----------------------------------------`);
    
    // Query a single record or limit 0 to inspect structure
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`Error consultando tabla ${table}:`, error.message);
    } else {
      if (data && data.length > 0) {
        console.log('Columnas:', Object.keys(data[0]).join(' | '));
        console.log('Fila de muestra:', JSON.stringify(data[0], null, 2));
      } else {
        // Table is empty, try to get columns by selecting empty
        const { data: emptyData, error: emptyError } = await supabase.from(table).select('*').limit(0);
        if (emptyError) {
          console.error(`Error consultando tabla vacía ${table}:`, emptyError.message);
        } else {
          // Sometimes selecting limit 0 doesn't return column names in emptyData if it's an empty array.
          // Let's see if we can get it via RPC or database query, or just print empty.
          console.log('La tabla está vacía.');
        }
      }
    }
  }
}

// Install dotenv if needed
inspectSchema();

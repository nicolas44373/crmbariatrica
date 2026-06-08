const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDb() {
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
    'carpetas_quirurgicas'
  ];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error counting ${table}:`, error.message);
    } else {
      console.log(`Table ${table} has ${count} records.`);
    }
  }

  // Check unique values for carpetas_quirurgicas tracking states
  const { data: carpetas, error: carpError } = await supabase
    .from('carpetas_quirurgicas')
    .select('estado_tracking, cirujano_nombre, nutricionista_nombre, psicologo_nombre')
    .limit(10);
  console.log('\nSample folders:', carpetas);

  // Check professional list
  const { data: profs, error: profsError } = await supabase
    .from('profesionales')
    .select('nombres, apellido, email, rol, activo, especialidad');
  if (profsError) console.error('Error fetching professionals:', profsError.message);
  console.log('\nProfessionals list:', profs);
}

checkDb();

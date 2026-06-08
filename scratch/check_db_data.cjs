const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDb() {
  const tables = ['pacientes', 'historias_clinicas', 'turnos', 'cirugias', 'evoluciones'];
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

  // Print a sample history
  const { data: histSample, error: histErr } = await supabase
    .from('historias_clinicas')
    .select('*')
    .limit(1);
  console.log('\nSample Historia Clinica:', histSample);

  // Print a sample patient
  const { data: pacSample, error: pacErr } = await supabase
    .from('pacientes')
    .select('*')
    .limit(1);
  console.log('\nSample Patient:', pacSample);

  // Print a sample evolution
  const { data: evSample, error: evErr } = await supabase
    .from('evoluciones')
    .select('*')
    .limit(1);
  console.log('\nSample Evolucion:', evSample);
}

checkDb();

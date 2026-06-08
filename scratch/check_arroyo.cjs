const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkArroyo() {
  const nrohc = 5716;
  const idPaciente = `P-${nrohc}`;
  console.log(`Checking database records for patient ID: ${idPaciente} (NroHC: ${nrohc})...`);

  // Query patient
  const { data: pac, error: pacErr } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id_paciente', idPaciente)
    .maybeSingle();
  console.log('Patient record:', pac || pacErr);

  // Query history
  const { data: hist, error: histErr } = await supabase
    .from('historias_clinicas')
    .select('*')
    .eq('id_paciente', idPaciente)
    .maybeSingle();
  console.log('History record:', hist || histErr);

  // Query turnos count
  const { count: turnosCount } = await supabase
    .from('turnos')
    .select('*', { count: 'exact', head: true })
    .eq('id_paciente', idPaciente);
  console.log('Turnos count:', turnosCount);

  // Query cirugias
  const { data: qx, error: qxErr } = await supabase
    .from('cirugias')
    .select('*')
    .eq('id_paciente', idPaciente)
    .maybeSingle();
  console.log('Surgery record:', qx || qxErr);

  // Query evoluciones
  const { data: evs, error: evsErr } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('id_paciente', idPaciente);
  console.log('Evoluciones count:', evs ? evs.length : 0);
  if (evs && evs.length > 0) {
    console.log('Sample evolution nota_clinica (first 200 chars):');
    console.log(evs[0].nota_clinica.substring(0, 200));
  }
}

checkArroyo();

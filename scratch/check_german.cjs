const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkGerman() {
  const nrohc = 875;
  const idPaciente = `P-${nrohc}`;
  console.log(`Checking database records for patient ID: ${idPaciente} (NroHC: ${nrohc})...`);

  // Patient
  const { data: pac } = await supabase.from('pacientes').select('*').eq('id_paciente', idPaciente).maybeSingle();
  console.log('Patient record tag (etiqueta_activa):', pac?.etiqueta_activa);
  console.log('Patient details: Sexo =', pac?.sexo, ', Localidad =', pac?.localidad);

  // History
  const { data: hist } = await supabase.from('historias_clinicas').select('*').eq('id_paciente', idPaciente).maybeSingle();
  console.log('History record: Peso Inicial =', hist?.peso_inicial, 'kg, Talla =', hist?.talla_cm, 'cm, IMC =', hist?.imc_inicial);

  // Surgery
  const { data: qx } = await supabase.from('cirugias').select('*').eq('id_paciente', idPaciente).maybeSingle();
  console.log('Surgery record: Date =', qx?.fecha_realizada, ', Type =', qx?.tipo_cirugia);

  // Specialty - Nutrition & Psychology
  const { data: nut } = await supabase.from('nutricion_info').select('*').eq('id_paciente', idPaciente).maybeSingle();
  console.log('Nutrition info: Cintura =', nut?.perimetro_cintura, ', Cuello =', nut?.perimetro_cuello);

  const { data: psi } = await supabase.from('psicologia_info').select('*').eq('id_paciente', idPaciente).maybeSingle();
  console.log('Psychology info notes (first 100 chars):', psi?.notas_privadas?.substring(0, 100));

  // Evoluciones
  const { data: evs } = await supabase.from('evoluciones').select('*').eq('id_paciente', idPaciente);
  console.log('Evoluciones count:', evs ? evs.length : 0);
  if (evs && evs.length > 0) {
    console.log('Sample evolution nota_clinica (first 250 chars):');
    console.log(evs[0].nota_clinica.substring(0, 250));
  }
}

checkGerman();

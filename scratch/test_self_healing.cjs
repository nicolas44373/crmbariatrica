const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  const manualHc = 8500;
  const manualDni = 'TEST_MANUAL_' + Math.floor(Math.random() * 1000000);

  try {
    console.log(`Step 1: Inserting patient with manual nro_hc = ${manualHc}...`);
    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        apellido: 'TEST_MANUAL_LN',
        nombres: 'TEST_MANUAL_FN',
        dni: manualDni,
        nro_hc: manualHc,
        etiqueta_activa: 'NUEVO_INGRESO'
      })
      .select('id_paciente, nro_hc');

    if (error) {
      console.error('Full Error Object:');
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.log('Successfully inserted manual patient:', data);
      await supabase.from('pacientes').delete().eq('dni', manualDni);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

run();

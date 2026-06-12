const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  try {
    const testDni = 'TEST_' + Math.floor(Math.random() * 1000000);
    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        apellido: 'TEST_LASTNAME',
        nombres: 'TEST_FIRSTNAME',
        dni: testDni,
        etiqueta_activa: 'NUEVO_INGRESO'
      })
      .select('id_paciente, nro_hc');

    if (error) {
      console.error('Full Error Object:');
      console.error(JSON.stringify(error, null, 2));
      console.error('Error Details:', error.details || error.detail);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();

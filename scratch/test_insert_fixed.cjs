const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testing insert on pacientes table...');
  const testPatient = {
    apellido: 'TEST_MIGRATION',
    nombres: 'TEST_PATIENT',
    dni: '99999999',
    obra_social: 'TEST_OS',
    nro_hc: 99999
  };

  const { data, error } = await supabase.from('pacientes').insert(testPatient).select();
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert succeeded! Data:', data);
    
    // Clean up
    console.log('Cleaning up...');
    const { error: deleteError } = await supabase.from('pacientes').delete().eq('nro_hc', 99999);
    if (deleteError) {
      console.error('Cleanup failed:', deleteError.message);
    } else {
      console.log('Cleanup succeeded.');
    }
  }
}

testInsert();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Testing insert on pacientes table...');
  const testPatient = {
    apellido: 'TEST_MIGRATION',
    nombres: 'TEST_PATIENT',
    dni: '99999999',
    obra_social: 'TEST_OS',
    nro_hc: -99
  };

  const { data, error } = await supabase.from('pacientes').insert(testPatient).select();
  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('Insert succeeded! Data:', data);
    
    // Clean up
    console.log('Cleaning up test patient...');
    const { error: deleteError } = await supabase.from('pacientes').delete().eq('nro_hc', -99);
    if (deleteError) {
      console.error('Cleanup failed:', deleteError.message);
    } else {
      console.log('Cleanup succeeded.');
    }
  }
}

testInsert();

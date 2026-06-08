const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testManualId() {
  console.log('Inserting patient with manual id_paciente: "P-999990"...');
  
  const { data, error } = await supabase
    .from('pacientes')
    .insert({
      id_paciente: 'P-999990',
      apellido: 'TEST_MANUAL',
      nombres: 'TEST_MANUAL',
      dni: 'TEST-MANUAL-ID-DNI',
      nro_hc: 999990
    })
    .select('*');

  if (error) {
    console.error('Error inserting manual ID:', error.message);
    console.error('Details:', error.details);
  } else {
    console.log('Successfully inserted patient with manual ID:', data[0]);
    // Clean up
    await supabase.from('pacientes').delete().eq('id_paciente', 'P-999990');
    console.log('Deleted test patient.');
  }
}

testManualId();

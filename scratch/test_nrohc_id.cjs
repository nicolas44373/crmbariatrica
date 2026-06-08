const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNrohcId() {
  console.log('Inserting patient with nro_hc: 100...');
  const { data: p1, error: e1 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'TEST_100',
      nombres: 'TEST_100',
      dni: 'TEST-DNI-100',
      nro_hc: 100
    })
    .select('*');

  if (e1) {
    console.error('Error inserting 100:', e1.message);
  } else {
    console.log('Result for nro_hc 100:', p1[0].id_paciente);
    // Clean up
    await supabase.from('pacientes').delete().eq('id_paciente', p1[0].id_paciente);
  }

  console.log('Inserting patient with nro_hc: 20000...');
  const { data: p2, error: e2 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'TEST_20000',
      nombres: 'TEST_20000',
      dni: 'TEST-DNI-20000',
      nro_hc: 20000
    })
    .select('*');

  if (e2) {
    console.error('Error inserting 20000:', e2.message);
  } else {
    console.log('Result for nro_hc 20000:', p2[0].id_paciente);
    // Clean up
    await supabase.from('pacientes').delete().eq('id_paciente', p2[0].id_paciente);
  }
}

testNrohcId();

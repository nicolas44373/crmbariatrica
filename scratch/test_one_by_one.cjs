const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOneByOne() {
  console.log('Inserting patient 1...');
  const { data: p1, error: e1 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'ONE_BY_ONE_1',
      nombres: 'TEST_1',
      dni: 'TEST-OBO-1',
      nro_hc: 90001
    })
    .select('id_paciente');

  if (e1) {
    console.error('Error inserting 1:', e1.message);
  } else {
    console.log('Patient 1 ID:', p1[0].id_paciente);
  }

  console.log('Inserting patient 2...');
  const { data: p2, error: e2 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'ONE_BY_ONE_2',
      nombres: 'TEST_2',
      dni: 'TEST-OBO-2',
      nro_hc: 90002
    })
    .select('id_paciente');

  if (e2) {
    console.error('Error inserting 2:', e2.message);
  } else {
    console.log('Patient 2 ID:', p2[0].id_paciente);
  }

  console.log('Inserting patient 3...');
  const { data: p3, error: e3 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'ONE_BY_ONE_3',
      nombres: 'TEST_3',
      dni: 'TEST-OBO-3',
      nro_hc: 90003
    })
    .select('id_paciente');

  if (e3) {
    console.error('Error inserting 3:', e3.message);
  } else {
    console.log('Patient 3 ID:', p3[0].id_paciente);
  }

  // Clean up
  console.log('Cleaning up...');
  if (p1) await supabase.from('pacientes').delete().eq('id_paciente', p1[0].id_paciente);
  if (p2) await supabase.from('pacientes').delete().eq('id_paciente', p2[0].id_paciente);
  if (p3) await supabase.from('pacientes').delete().eq('id_paciente', p3[0].id_paciente);
  console.log('Cleanup done.');
}

testOneByOne();

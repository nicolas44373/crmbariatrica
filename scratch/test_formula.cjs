const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFormula() {
  console.log('Inserting patient with nro_hc: 4557...');
  const { data: p1, error: e1 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'TEST_4557',
      nombres: 'TEST_4557',
      dni: 'TEST-DNI-4557',
      nro_hc: 4557
    })
    .select('*');

  if (e1) {
    console.error('Error inserting 4557:', e1.message);
  } else {
    console.log('Result for nro_hc 4557:', p1[0].id_paciente);
    await supabase.from('pacientes').delete().eq('id_paciente', p1[0].id_paciente);
  }

  console.log('Inserting patient with nro_hc: 4558...');
  const { data: p2, error: e2 } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'TEST_4558',
      nombres: 'TEST_4558',
      dni: 'TEST-DNI-4558',
      nro_hc: 4558
    })
    .select('*');

  if (e2) {
    console.error('Error inserting 4558:', e2.message);
  } else {
    console.log('Result for nro_hc 4558:', p2[0].id_paciente);
    await supabase.from('pacientes').delete().eq('id_paciente', p2[0].id_paciente);
  }
}

testFormula();

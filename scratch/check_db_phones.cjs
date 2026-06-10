const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkPhones() {
  const { data, error } = await supabase.from('pacientes').select('id_paciente, nombres, apellido, telefono, telefono_2').limit(15);
  if (error) {
    console.error(error);
  } else {
    console.log('Database Patient Phones:');
    console.log(data);
  }
}

checkPhones();

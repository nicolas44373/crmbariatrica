const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectNames() {
  console.log('Querying patients with potential symbol noise...');
  
  // Let's fetch patients where names start with '-', '.', or other symbols
  const { data: patients, error } = await supabase
    .from('pacientes')
    .select('id_paciente, nro_hc, apellido, nombres, dni, telefono')
    .limit(100); // just get a sample of up to 100
    
  if (error) {
    console.error('Error fetching patients:', error.message);
    return;
  }

  const suspiciousPatients = patients.filter(p => {
    const ap = String(p.apellido || '').trim();
    const nom = String(p.nombres || '').trim();
    return ap.startsWith('-') || ap.startsWith('.') || nom.startsWith('-') || nom.startsWith('.');
  });

  console.log(`Found ${suspiciousPatients.length} suspicious patients in this sample of ${patients.length}.`);
  
  // Let's fetch more specifically using filters if we want, or do it locally
  // Let's query patients starting with '-' or '.' in general:
  const { data: allSuspicious, error: err2 } = await supabase
    .from('pacientes')
    .select('id_paciente, nro_hc, apellido, nombres, DNI:dni, Created:created_at')
    .or('apellido.like.-%,apellido.like..%,nombres.like.-%,nombres.like..%')
    .limit(100);

  if (err2) {
    console.error('Error fetching all suspicious:', err2.message);
  } else {
    console.log(`Total suspicious patients found (first 100): ${allSuspicious.length}`);
    allSuspicious.slice(0, 30).forEach((p, idx) => {
      console.log(`${idx}. HC: ${p.nro_hc} | AP: "${p.apellido}" | NOM: "${p.nombres}" | DNI: ${p.DNI}`);
    });
  }
}

inspectNames();

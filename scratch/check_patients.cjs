const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPatients() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id_paciente, nro_hc, apellido, nombres, dni')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching patients:', error.message);
    return;
  }

  console.log(`Found ${data.length} patients in the database.`);
  if (data.length > 0) {
    console.log('First 5 patients:');
    console.log(data.slice(0, 5));
    console.log('Last 5 patients:');
    console.log(data.slice(-5));
    
    // Check if there are any duplicate id_paciente values (should not be possible in DB, but let's see if we can analyze)
    const ids = data.map(p => p.id_paciente);
    const uniqueIds = new Set(ids);
    console.log(`Unique IDs count: ${uniqueIds.size} / ${ids.length}`);
  }
}

checkPatients();

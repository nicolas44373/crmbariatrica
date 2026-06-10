const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdmin() {
  const { data, error } = await supabase
    .from('profesionales')
    .select('email, nombres, apellido')
    .eq('email', 'admin@clinicabariatrica.com');
    
  if (error) {
    console.error('Error querying:', error.message);
  } else {
    console.log('Admin professional in DB:', data);
  }
}

checkAdmin();

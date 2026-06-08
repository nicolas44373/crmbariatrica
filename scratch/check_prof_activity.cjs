const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActivity() {
  // Get distinct professional emails in turnos
  const { data: turnosProfs, error: turnosErr } = await supabase
    .from('turnos')
    .select('profesional_email');
  
  // Get distinct professional emails in evoluciones
  const { data: evolucionesProfs, error: evErr } = await supabase
    .from('evoluciones')
    .select('profesional_email');

  const turnosEmails = new Set((turnosProfs ?? []).map(t => t.profesional_email));
  const evolucionesEmails = new Set((evolucionesProfs ?? []).map(e => e.profesional_email));

  console.log('Emails in turnos:', Array.from(turnosEmails));
  console.log('Emails in evoluciones:', Array.from(evolucionesEmails));
}

checkActivity();

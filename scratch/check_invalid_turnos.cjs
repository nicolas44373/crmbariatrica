const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching all turnos...');
  const { data: turnos, error: err1 } = await supabase.from('turnos').select('id_turno, id_paciente, profesional_email');
  if (err1) {
    console.error('Error fetching turnos:', err1.message);
    return;
  }
  console.log(`Total turnos: ${turnos.length}`);

  console.log('Checking for invalid profesional_emails...');
  const { data: profs, error: err2 } = await supabase.from('profesionales').select('email');
  if (err2) {
    console.error('Error fetching professionals:', err2.message);
    return;
  }
  const profEmails = new Set(profs.map(p => p.email));
  console.log('Valid professional emails:', Array.from(profEmails));

  const invalidProfs = [];
  turnos.forEach(t => {
    if (!profEmails.has(t.profesional_email)) {
      invalidProfs.push(t);
    }
  });

  if (invalidProfs.length > 0) {
    console.log(`Found ${invalidProfs.length} turnos with invalid professional emails!`, invalidProfs.slice(0, 10));
  } else {
    console.log('All turnos have valid professional emails.');
  }

  console.log('Checking for invalid id_pacientes...');
  const { data: pacs, error: err3 } = await supabase.from('pacientes').select('id_paciente');
  if (err3) {
    console.error('Error fetching patients:', err3.message);
    return;
  }
  const pacIds = new Set(pacs.map(p => p.id_paciente));

  const invalidPacs = [];
  turnos.forEach(t => {
    if (t.id_paciente && !pacIds.has(t.id_paciente)) {
      invalidPacs.push(t);
    }
  });

  if (invalidPacs.length > 0) {
    console.log(`Found ${invalidPacs.length} turnos with invalid patient IDs!`, invalidPacs.slice(0, 10));
  } else {
    console.log('All turnos have valid patient IDs.');
  }
}

run();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvoluciones() {
  console.log('Fetching patients starting with - or . ...');
  
  const { data: patients, error } = await supabase
    .from('pacientes')
    .select('id_paciente, nro_hc, apellido, nombres, dni');

  if (error) {
    console.error('Error fetching patients:', error.message);
    return;
  }

  const suspicious = patients.filter(p => {
    const ap = String(p.apellido || '').trim();
    const nom = String(p.nombres || '').trim();
    return ap.startsWith('-') || ap.startsWith('.') || nom.startsWith('-') || nom.startsWith('.');
  });

  console.log(`Total suspicious patients: ${suspicious.length} out of ${patients.length}`);

  if (suspicious.length === 0) return;

  // Let's count how many of these suspicious patients have evoluciones
  const suspIds = suspicious.map(p => p.id_paciente);
  
  // We can select counts from 'evoluciones' where id_paciente is in suspIds
  // Since suspIds can be large, let's query in batches of 100
  let withEvolucionesCount = 0;
  const sampleWithEvos = [];

  for (let i = 0; i < suspIds.length; i += 100) {
    const batchIds = suspIds.slice(i, i + 100);
    const { data: evos, error: evErr } = await supabase
      .from('evoluciones')
      .select('id_paciente')
      .in('id_paciente', batchIds);
      
    if (evErr) {
      console.error('Error counting evoluciones:', evErr.message);
    } else if (evos) {
      const uniquePatientsInEvos = new Set(evos.map(e => e.id_paciente));
      withEvolucionesCount += uniquePatientsInEvos.size;
      
      uniquePatientsInEvos.forEach(id => {
        const p = suspicious.find(sp => sp.id_paciente === id);
        if (p && sampleWithEvos.length < 10) {
          sampleWithEvos.push(p);
        }
      });
    }
  }

  console.log(`Suspicious patients WITH clinical evolutions: ${withEvolucionesCount}`);
  console.log('Sample suspicious patients who HAVE evolutions:');
  sampleWithEvos.forEach(p => {
    console.log(`- HC: ${p.nro_hc} | Name: ${p.apellido}, ${p.nombres} | DNI: ${p.dni}`);
  });
}

checkEvoluciones();

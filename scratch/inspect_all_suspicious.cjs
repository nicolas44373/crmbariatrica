const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectAll() {
  console.log('Querying all patients...');
  
  // Let's fetch all patients (using fetchAll logic)
  let allPatients = [];
  let from = 0;
  let to = 999;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id_paciente, nro_hc, apellido, nombres, dni')
      .range(from, to);
      
    if (error) {
      console.error('Error fetching batch:', error.message);
      break;
    }
    
    if (data.length === 0) {
      hasMore = false;
    } else {
      allPatients = allPatients.concat(data);
      from += 1000;
      to += 1000;
    }
  }

  console.log(`Total patients in database: ${allPatients.length}`);

  const suspicious = allPatients.filter(p => {
    const ap = String(p.apellido || '').trim();
    const nom = String(p.nombres || '').trim();
    return ap.startsWith('-') || ap.startsWith('.') || nom.startsWith('-') || nom.startsWith('.');
  });

  console.log(`Total patients with names starting with - or . : ${suspicious.length}`);

  if (suspicious.length === 0) return;

  // Let's check how many of these have evoluciones or turnos
  const suspIds = suspicious.map(p => p.id_paciente);
  
  // Let's batch check evoluciones
  const idsWithEvos = new Set();
  for (let i = 0; i < suspIds.length; i += 100) {
    const batch = suspIds.slice(i, i + 100);
    const { data: evos } = await supabase
      .from('evoluciones')
      .select('id_paciente')
      .in('id_paciente', batch);
    if (evos) {
      evos.forEach(e => idsWithEvos.add(e.id_paciente));
    }
  }

  // Let's batch check turnos
  const idsWithTurnos = new Set();
  for (let i = 0; i < suspIds.length; i += 100) {
    const batch = suspIds.slice(i, i + 100);
    const { data: turns } = await supabase
      .from('turnos')
      .select('id_paciente')
      .in('id_paciente', batch);
    if (turns) {
      turns.forEach(t => idsWithTurnos.add(t.id_paciente));
    }
  }

  let withDataCount = 0;
  let withoutDataCount = 0;

  suspicious.forEach(p => {
    const hasEvo = idsWithEvos.has(p.id_paciente);
    const hasTurno = idsWithTurnos.has(p.id_paciente);
    if (hasEvo || hasTurno) {
      withDataCount++;
    } else {
      withoutDataCount++;
    }
  });

  console.log(`Suspicious patients WITH evoluciones/turnos (real data): ${withDataCount}`);
  console.log(`Suspicious patients WITHOUT evoluciones/turnos (junk/empty): ${withoutDataCount}`);
  
  if (withoutDataCount > 0) {
    console.log('\nSample empty/junk suspicious patients (candidates for deletion):');
    const emptySamples = suspicious.filter(p => !idsWithEvos.has(p.id_paciente) && !idsWithTurnos.has(p.id_paciente));
    emptySamples.slice(0, 10).forEach(p => {
      console.log(`- HC: ${p.nro_hc} | Name: ${p.apellido}, ${p.nombres} | DNI: ${p.dni}`);
    });
  }
}

inspectAll();

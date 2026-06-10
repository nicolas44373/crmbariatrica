const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const XLSX = require('xlsx');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const backupDir = path.join(__dirname, '..', 'backup');
const dataDir = path.join(backupDir, 'Tablas de Datos');
const plenusDir = path.join(backupDir, 'Plenus');

// Load medicos
const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

const doctorInitialsToEmail = {};
medicosData.forEach(doc => {
  const email = doc.MAIL ? doc.MAIL.trim().toLowerCase() : `medico_${doc.ID}@plenus.ar`;
  const initials = doc.INICIALES ? doc.INICIALES.trim().toUpperCase() : '';
  doctorInitialsToEmail[initials] = email;
});

function isRTFEmptyHeader(content) {
  let temp = content
    .replace(/\\par/g, ' ')
    .replace(/\\b/g, ' ')
    .replace(/\\b0/g, ' ')
    .replace(/\\rt/g, ' ')
    .replace(/\\rtf\d*/g, ' ')
    .replace(/\{[^\}]*\}/g, ' ')
    .replace(/Paciente:\s*[^\\]*/i, '')
    .replace(/DNI:\s*[^\\]*/i, '')
    .replace(/NroHC:\s*[^\\]*/i, '')
    .replace(/Fecha:\s*[^\\]*/i, '')
    .replace(/\\ansi[^\s]*/g, '')
    .replace(/\\[a-z0-9]+/g, ' ')
    .replace(/[{}]/g, ' ')
    .trim();
  temp = temp.replace(/\s+/g, ' ').trim();
  return temp.length < 15;
}

const actualRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;

async function checkAll() {
  console.log('Fetching patients from Supabase...');
  
  let allPatients = [];
  let from = 0;
  let to = 999;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id_paciente, nro_hc, apellido, nombres')
      .range(from, to);
    if (error) {
      console.error(error);
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
  
  console.log(`Total patients in Supabase: ${allPatients.length}`);
  
  // Fetch count of evoluciones per patient from Supabase
  console.log('Fetching evoluciones counts from Supabase...');
  let allEvos = [];
  from = 0;
  to = 999;
  hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('evoluciones')
      .select('id_paciente')
      .range(from, to);
    if (error) {
      console.error(error);
      break;
    }
    if (data.length === 0) {
      hasMore = false;
    } else {
      allEvos = allEvos.concat(data);
      from += 1000;
      to += 1000;
    }
  }
  
  console.log(`Total evoluciones in Supabase: ${allEvos.length}`);
  
  const dbEvosCount = {};
  allEvos.forEach(e => {
    dbEvosCount[e.id_paciente] = (dbEvosCount[e.id_paciente] || 0) + 1;
  });
  
  const files = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));
  
  let mismatchCount = 0;
  console.log('\nChecking mismatches...');
  
  const mismatchesList = [];
  
  files.forEach(file => {
    const parts = file.split('-');
    if (parts.length < 2) return;
    const nrohc = parseInt(parts[0].trim(), 10);
    if (isNaN(nrohc)) return;
    
    const uuid = `P-${nrohc}`;
    
    // Check if patient exists in Supabase
    const pac = allPatients.find(p => p.id_paciente === uuid);
    if (!pac) return; // skipped if not a real patient
    
    const filePath = path.join(plenusDir, file);
    const content = fs.readFileSync(filePath, 'latin1');
    
    if (isRTFEmptyHeader(content)) return;
    
    let matchesCount = 0;
    const contentCopy = content;
    let match;
    actualRegex.lastIndex = 0; // reset regex
    while ((match = actualRegex.exec(contentCopy)) !== null) {
      matchesCount++;
    }
    
    const dbCount = dbEvosCount[uuid] || 0;
    
    if (matchesCount > 0 && dbCount === 0) {
      mismatchCount++;
      mismatchesList.push({
        nrohc,
        name: `${pac.apellido}, ${pac.nombres}`,
        rtfMatches: matchesCount,
        dbCount
      });
    }
  });
  
  console.log(`Total patients with RTF matches but 0 in DB: ${mismatchCount}`);
  console.log('Sample mismatch patients:');
  mismatchesList.slice(0, 30).forEach(m => {
    console.log(`- HC: ${m.nrohc} | Name: ${m.name} | RTF Matches: ${m.rtfMatches} | DB Count: ${m.dbCount}`);
  });
}

checkAll();

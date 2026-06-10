const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const XLSX = require('xlsx');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');
const plenusDir = path.join(backupDir, 'Plenus');

// Load medicosData
const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

const doctorInitialsToEmail = {};
medicosData.forEach(doc => {
  const email = doc.MAIL ? doc.MAIL.trim().toLowerCase() : `medico_${doc.ID}@plenus.ar`;
  const initials = doc.INICIALES ? doc.INICIALES.trim().toUpperCase() : '';
  doctorInitialsToEmail[initials] = email;
});

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
const realPatients = pacientesData.filter(p => p.NROHC > 0);

const nrohcToUuid = {};
realPatients.forEach(p => {
  nrohcToUuid[p.NROHC] = `P-${p.NROHC}`;
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

async function run() {
  const { data: dbProfs, error } = await supabase.from('profesionales').select('email');
  if (error) {
    console.error('Error fetching DB professionals:', error);
    return;
  }
  const dbProfEmails = new Set(dbProfs.map(p => p.email));
  console.log('Database professional emails:', Array.from(dbProfEmails));

  const rtfFiles = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));
  const allInitials = new Set();
  const allEmails = new Set();

  rtfFiles.forEach((file) => {
    const parts = file.split('-');
    if (parts.length < 2) return;
    const nrohc = parseInt(parts[0].trim(), 10);
    if (isNaN(nrohc)) return;
    const uuid = nrohcToUuid[nrohc];
    if (!uuid) return;
    
    const filePath = path.join(plenusDir, file);
    const content = fs.readFileSync(filePath, 'latin1');
    if (isRTFEmptyHeader(content)) return;
    
    const entryRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
    
    let match;
    while ((match = entryRegex.exec(content)) !== null) {
      const initials = (match[2] || '').trim().toUpperCase();
      allInitials.add(initials);
      const email = doctorInitialsToEmail[initials] || 'admin@clinicabariatrica.com';
      allEmails.add(email);
    }
  });

  console.log('\nAll unique initials parsed from RTFs:', Array.from(allInitials));
  console.log('\nAll unique emails parsed from RTFs:', Array.from(allEmails));

  console.log('\nMissing emails in DB:');
  let missingCount = 0;
  for (const email of allEmails) {
    if (!dbProfEmails.has(email)) {
      console.log(`- ${email}`);
      missingCount++;
    }
  }
  if (missingCount === 0) {
    console.log('None! All emails are present in the DB.');
  }
}

run();

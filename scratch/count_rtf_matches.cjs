const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const backupDir = path.join(__dirname, '..', 'backup');
const dataDir = path.join(backupDir, 'Tablas de Datos');
const plenusDir = path.join(backupDir, 'Plenus');

// Load medicosData to populate initials
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

const rtfFiles = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));
console.log('Total RTF files:', rtfFiles.length);

let notInExcelCount = 0;
let emptyHeaderCount = 0;
let totalMatches = 0;
let fileWithMatchesCount = 0;
let fileWithNoMatchesCount = 0;

const sampleSkips = [];

rtfFiles.forEach((file) => {
  const parts = file.split('-');
  if (parts.length < 2) return;
  
  const nrohc = parseInt(parts[0].trim(), 10);
  if (isNaN(nrohc)) return;
  
  const uuid = nrohcToUuid[nrohc];
  if (!uuid) {
    notInExcelCount++;
    return;
  }
  
  const filePath = path.join(plenusDir, file);
  const content = fs.readFileSync(filePath, 'latin1');
  
  if (isRTFEmptyHeader(content)) {
    emptyHeaderCount++;
    return;
  }
  
  const entryRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\\\[([a-zA-Z]*)\\\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
  
  let match;
  let matchesCount = 0;
  // We use the same regex search
  const contentCopy = content;
  
  // Wait! In migrate_data.cjs the regex is:
  // /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
  // Wait, let's look at the difference!
  // In our count_rtf_matches.cjs entryRegex, did we put '\\[' and '\\]' instead of '\[' and '\]'?
  // Yes! The migrate_data.cjs regex has: (?:\[([a-zA-Z]*)\])?
  // But wait! Is there a backslash in migrate_data.cjs?
  // Let's check line 613 of migrate_data.cjs:
  // const entryRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
  // Yes, it has (?:\[([a-zA-Z]*)\])?
  
  const actualRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
  
  while ((match = actualRegex.exec(contentCopy)) !== null) {
    matchesCount++;
  }
  
  if (matchesCount > 0) {
    totalMatches += matchesCount;
    fileWithMatchesCount++;
  } else {
    fileWithNoMatchesCount++;
    if (sampleSkips.length < 10) {
      sampleSkips.push({ nrohc, file });
    }
  }
});

console.log(`\nStatistics:`);
console.log(`- Not in Excel: ${notInExcelCount}`);
console.log(`- Empty Header: ${emptyHeaderCount}`);
console.log(`- Files with matches: ${fileWithMatchesCount}`);
console.log(`- Files with NO matches: ${fileWithNoMatchesCount}`);
console.log(`- Total matches found: ${totalMatches}`);

console.log('\nSample files with NO matches:');
sampleSkips.forEach(s => {
  console.log(`- HC: ${s.nrohc} | File: ${s.file}`);
});

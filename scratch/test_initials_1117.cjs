const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const backupDir = path.join(__dirname, '..', 'backup');
const dataDir = path.join(backupDir, 'Tablas de Datos');
const plenusDir = path.join(backupDir, 'Plenus');

const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

const doctorInitialsToEmail = {};
medicosData.forEach(doc => {
  const email = doc.MAIL ? doc.MAIL.trim().toLowerCase() : `medico_${doc.ID}@plenus.ar`;
  const initials = doc.INICIALES ? doc.INICIALES.trim().toUpperCase() : '';
  doctorInitialsToEmail[initials] = email;
});

const files = fs.readdirSync(plenusDir);
const file = files.find(f => f.startsWith('1117'));

if (file) {
  const filePath = path.join(plenusDir, file);
  const content = fs.readFileSync(filePath, 'latin1');
  
  const actualRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
  
  let match;
  const initialsSet = new Set();
  while ((match = actualRegex.exec(content)) !== null) {
    initialsSet.add(match[2] || 'NO_INITIALS');
  }
  
  console.log('Initials found in 1117 RTF file:', Array.from(initialsSet));
  console.log('Are they mapped to email?');
  Array.from(initialsSet).forEach(ini => {
    console.log(`- ${ini}: ${doctorInitialsToEmail[ini.toUpperCase()] || 'NOT MAPPED'}`);
  });
} else {
  console.log('File for 1117 not found');
}

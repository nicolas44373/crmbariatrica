const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const medicosWb = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWb.Sheets[medicosWb.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

console.log('Medicos passwords:');
medicosData.forEach(m => {
  const pass = m.PASS ? String(m.PASS).trim() : 'N/A';
  console.log(`- ${m.APELLIDO}, ${m.NOMBRE}: PASS="${pass}" (length: ${pass.length})`);
});

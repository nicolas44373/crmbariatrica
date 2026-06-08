const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);

const p = pacientesData.find(p => p.NROHC === 5414);
console.log('All fields for patient 5414:');
for (const [key, value] of Object.entries(p)) {
  console.log(`${key}: ${value} (${typeof value})`);
}

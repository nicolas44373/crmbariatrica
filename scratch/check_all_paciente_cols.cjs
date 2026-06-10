const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);

const allKeys = new Set();
pacientesData.forEach(row => {
  Object.keys(row).forEach(key => allKeys.add(key));
});

console.log('All unique columns in PACIENTES.xls across all rows:');
console.log(Array.from(allKeys));

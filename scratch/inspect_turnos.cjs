const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const workbook = XLSX.readFile(path.join(dataDir, 'TURNOS.xls'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total turns in TURNOS.xls:', data.length);
if (data.length > 0) {
  console.log('Columns of TURNOS.xls:', Object.keys(data[0]));
  console.log('Sample turn:', data[0]);
} else {
  console.log('No data');
}

const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);

if (pacientesData.length > 0) {
  console.log('Columns of PACIENTES.xls:', Object.keys(pacientesData[0]));
} else {
  console.log('No data');
}

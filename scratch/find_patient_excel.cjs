const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);

// Find patient with NROHC 5414
const p5414 = pacientesData.find(p => p.NROHC === 5414);
console.log('Patient NROHC 5414 in Excel:', p5414);

// Also find the index of this patient in the array
const index = pacientesData.findIndex(p => p.NROHC === 5414);
console.log('Index in pacientesData:', index);

// Let's print the first 5 patients in pacientesData
console.log('First 5 patients in Excel:', pacientesData.slice(0, 5));

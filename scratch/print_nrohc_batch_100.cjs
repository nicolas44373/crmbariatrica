const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
const realPatients = pacientesData.filter(p => p.NROHC > 0);

const batch = realPatients.slice(100, 200);
console.log('NROHC values in batch 100 (first 15):');
console.log(batch.slice(0, 15).map(p => ({ nrohc: p.NROHC, name: `${p.APELLIDO}, ${p.NOMBRE}` })));

console.log('Do we have any patient with NROHC = 4668 in this batch?');
const found = batch.find(p => p.NROHC === 4668);
console.log(found || 'Not found');

console.log('Do we have any patient whose NROHC - 4556 = 112?');
const found2 = batch.find(p => p.NROHC - 4556 === 112);
console.log(found2 || 'Not found');

console.log('Let\'s see all patients in batch 100 with nrohc - 4556:');
console.log(batch.map(p => p.NROHC - 4556));

const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
const validNrohcs = new Set(pacientesData.map(p => p.NROHC).filter(n => n > 0));

const turnosWorkbook = XLSX.readFile(path.join(dataDir, 'TURNOS.xls'));
const turnosSheet = turnosWorkbook.Sheets[turnosWorkbook.SheetNames[0]];
const turnosData = XLSX.utils.sheet_to_json(turnosSheet);

let blockedCount = 0;
let invalidPacIdCount = 0;
let validPacNotFoundCount = 0;

const sampleNotFound = [];

turnosData.forEach(t => {
  const pacId = t.ID_PACIENTE;
  if (pacId <= 0) {
    blockedCount++;
  } else {
    if (validNrohcs.has(pacId)) {
      // should be migrated
    } else {
      validPacNotFoundCount++;
      if (sampleNotFound.length < 5) {
        sampleNotFound.push(t);
      }
    }
  }
});

console.log(`Total turnos in Excel: ${turnosData.length}`);
console.log(`Turnos with blocked/negative patient ID: ${blockedCount}`);
console.log(`Turnos with patient ID > 0 but patient not in PACIENTES.xls: ${validPacNotFoundCount}`);
if (sampleNotFound.length > 0) {
  console.log('Sample of turnos with missing patient:');
  console.log(sampleNotFound);
}

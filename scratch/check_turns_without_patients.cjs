const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
const patientHcs = new Set(pacientesData.map(p => p.NROHC).filter(hc => hc > 0));

const turnosWorkbook = XLSX.readFile(path.join(dataDir, 'TURNOS.xls'));
const turnosSheet = turnosWorkbook.Sheets[turnosWorkbook.SheetNames[0]];
const turnosData = XLSX.utils.sheet_to_json(turnosSheet);

console.log('Total turns:', turnosData.length);
console.log('Total patients in PACIENTES.xls:', patientHcs.size);

const missingHcs = new Set();
let missingTurnsCount = 0;

turnosData.forEach(t => {
  if (t.ID_PACIENTE && !patientHcs.has(t.ID_PACIENTE)) {
    missingHcs.add(t.ID_PACIENTE);
    missingTurnsCount++;
  }
});

console.log(`Turns referencing non-existent patients: ${missingTurnsCount}`);
console.log(`Unique non-existent patient IDs referenced:`, Array.from(missingHcs));

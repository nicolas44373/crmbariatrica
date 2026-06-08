const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const turnosWorkbook = XLSX.readFile(path.join(dataDir, 'TURNOS.xls'));
const turnosSheet = turnosWorkbook.Sheets[turnosWorkbook.SheetNames[0]];
const turnosData = XLSX.utils.sheet_to_json(turnosSheet);

console.log(`Total turnos in Excel: ${turnosData.length}`);

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

const today = new Date('2026-06-08');
let futureCount = 0;
const futureSamples = [];

turnosData.forEach(t => {
  if (t.FECHA) {
    const d = excelDateToJSDate(t.FECHA);
    if (d && d > today) {
      futureCount++;
      if (futureSamples.length < 5) {
        futureSamples.push({
          id: t.ID,
          fecha: d.toISOString(),
          medico: t.MEDICO,
          id_paciente: t.ID_PACIENTE,
          paciente: t.PACIENTE,
          atendido: t.ATENDIDO,
          ausente: t.AUSENTE,
          llego: t.LLEGO,
          confirmado: t.CONFIRMADO
        });
      }
    }
  }
});

console.log(`Future turnos (after 2026-06-08): ${futureCount}`);
console.log('Samples of future turnos:');
console.log(futureSamples);

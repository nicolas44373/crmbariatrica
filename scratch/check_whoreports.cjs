const XLSX = require('xlsx');
const path = require('path');

const dataDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Tablas de Datos';
const workbook = XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

let cirCount = 0;
let nutCount = 0;
let psiCount = 0;

for (const row of data) {
  if (row.QUIENINFORMECIRUJANO !== undefined && row.QUIENINFORMECIRUJANO !== null && String(row.QUIENINFORMECIRUJANO).trim() !== '' && String(row.QUIENINFORMECIRUJANO).trim() !== '-1') {
    cirCount++;
  }
  if (row.QUIENINFORMENUTRICION !== undefined && row.QUIENINFORMENUTRICION !== null && String(row.QUIENINFORMENUTRICION).trim() !== '' && String(row.QUIENINFORMENUTRICION).trim() !== '-1') {
    nutCount++;
  }
  if (row.QUIENINFORMEPSICOLOGO !== undefined && row.QUIENINFORMEPSICOLOGO !== null && String(row.QUIENINFORMEPSICOLOGO).trim() !== '' && String(row.QUIENINFORMEPSICOLOGO).trim() !== '-1') {
    psiCount++;
  }
}

console.log('QUIENINFORMECIRUJANO non-empty:', cirCount);
console.log('QUIENINFORMENUTRICION non-empty:', nutCount);
console.log('QUIENINFORMEPSICOLOGO non-empty:', psiCount);

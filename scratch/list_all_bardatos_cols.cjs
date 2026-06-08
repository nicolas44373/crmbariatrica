const XLSX = require('xlsx');
const path = require('path');

const dataDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Tablas de Datos';
const workbook = XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const cols = new Set();
for (const row of data) {
  for (const k of Object.keys(row)) {
    cols.add(k);
  }
}
console.log('All unique columns in BAR_DATOS.xls:', Array.from(cols).sort());

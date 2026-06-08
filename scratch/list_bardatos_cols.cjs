const XLSX = require('xlsx');
const path = require('path');

const dataDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Tablas de Datos';
const workbook = XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

if (data.length > 0) {
  console.log('Columns in BAR_DATOS.xls:', Object.keys(data[0]));
} else {
  console.log('No data found');
}

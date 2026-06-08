const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Tablas de Datos';

function inspectExcel(filename, limit = 2) {
  const filePath = path.join(backupDir, filename);
  console.log(`\n=========================================`);
  console.log(`INSPECTING FILE: ${filename}`);
  console.log(`=========================================`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  const realData = filename === 'PACIENTES.xls' ? data.filter(r => r.NROHC > 0) : data;
  
  console.log(`Total rows: ${data.length}`);
  console.log(`First ${limit} rows:`, JSON.stringify(realData.slice(0, limit), null, 2));
}

inspectExcel('MEDICOS.xls', 2);
inspectExcel('PACIENTES.xls', 2);
inspectExcel('TURNOS.xls', 2);
inspectExcel('BAR_ANTECEDENTES.xls', 2);
inspectExcel('BAR_DATOS.xls', 1);
inspectExcel('BAR_CIRUGIA.xls', 2);
inspectExcel('CLI_ANTECEDENTES.xls', 2);

const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);

console.log('Sample patient phone columns:');
const sample = pacientesData.filter(p => p.WHATSAPP || p.TEL || p.TEL2).slice(0, 20);
sample.forEach(p => {
  console.log(`NROHC: ${p.NROHC} | Name: ${p.NOMBRE} ${p.APELLIDO}`);
  console.log(`  DDI: ${p.DDI || ''} | WHATSAPP: ${p.WHATSAPP || ''}`);
  console.log(`  TEL: ${p.TEL || ''} | TEL2: ${p.TEL2 || ''} | DDI2: ${p.DDI2 || ''}`);
});

const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const medicosWb = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWb.Sheets[medicosWb.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

console.log('Medicos specialties in backup:');
medicosData.forEach(m => {
  console.log(`- ${m.APELLIDO}, ${m.NOMBRE}: INICIALES="${m.INICIALES}", ESPECIALIDAD="${m.ESPECIALIDAD}"`);
});

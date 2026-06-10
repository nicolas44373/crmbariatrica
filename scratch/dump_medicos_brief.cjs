const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

console.log('Total doctors:', medicosData.length);
medicosData.forEach(d => {
  console.log(`ID: ${d.ID}, Name: ${d.NOMBRE} ${d.APELLIDO}, Initials: ${d.INICIALES}, Email: ${d.MAIL || 'N/A'}`);
});

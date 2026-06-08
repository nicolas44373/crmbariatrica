const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';

function inspectFolder(folderName) {
  const folderPath = path.join(backupDir, folderName);
  if (!fs.existsSync(folderPath)) {
    console.log(`Folder not found: ${folderPath}`);
    return;
  }

  console.log(`\n=========================================`);
  console.log(`INSPECTING FOLDER: ${folderName}`);
  console.log(`=========================================`);

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));
  
  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    try {
      const workbook = XLSX.readFile(filePath);
      console.log(`\nArchivo: ${file}`);
      console.log(`Hojas: ${workbook.SheetNames.join(', ')}`);
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON to get the row count and headers
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length > 0) {
        const headers = data[0];
        console.log(`Filas de datos: ${data.length - 1}`);
        console.log(`Columnas: ${headers.join(' | ')}`);
      } else {
        console.log(`La hoja está vacía.`);
      }
    } catch (err) {
      console.error(`Error leyendo ${file}:`, err.message);
    }
  });
}

inspectFolder('Tablas Maestras');
inspectFolder('Tablas de Datos');

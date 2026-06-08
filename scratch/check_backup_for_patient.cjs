const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const nrohc = 5716;

function checkFile(fileName, searchKey) {
  const filePath = path.join(dataDir, fileName);
  console.log(`\n--- Checking ${fileName} ---`);
  try {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Total rows in ${fileName}: ${data.length}`);
    
    // Find all rows matching searchKey
    const matches = data.filter(row => {
      for (const val of Object.values(row)) {
        if (val == searchKey) return true;
      }
      return false;
    });
    
    console.log(`Found ${matches.length} matches for ${searchKey}:`);
    if (matches.length > 0) {
      console.log(JSON.stringify(matches, null, 2));
    }
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err.message);
  }
}

checkFile('PACIENTES.xls', nrohc);
checkFile('CLI_ANTECEDENTES.xls', nrohc);
checkFile('BAR_CIRUGIA.xls', nrohc);
checkFile('BAR_DATOS.xls', nrohc);
checkFile('TURNOS.xls', nrohc);

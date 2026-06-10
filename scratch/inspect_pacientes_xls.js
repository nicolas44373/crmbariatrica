const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backup', 'Tablas de Datos', 'PACIENTES.xls');
console.log('Reading:', filePath);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total records:', data.length);
if (data.length > 0) {
  console.log('All available columns in first row:', Object.keys(data[0]));
  console.log('Sample record 0:', data[0]);
  console.log('Sample record 1:', data[1]);
  console.log('Sample record 2:', data[2]);
  
  // Let's find columns containing 'tel' or similar
  const keys = Object.keys(data[0]);
  console.log('\nColumns matching tel/cel/phone case-insensitive:');
  keys.forEach(k => {
    if (k.toLowerCase().includes('tel') || k.toLowerCase().includes('cel') || k.toLowerCase().includes('pho') || k.toLowerCase().includes('nro') || k.toLowerCase().includes('contacto')) {
      console.log(`- ${k}`);
    }
  });

  // Let's print out if we see any non-empty fields resembling phones in the first 20 records
  console.log('\nFirst 20 records phone data check:');
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const r = data[i];
    const phoneKeys = keys.filter(k => k.toLowerCase().includes('tel') || k.toLowerCase().includes('cel'));
    const phoneVals = phoneKeys.map(k => `${k}: ${r[k]}`).join(', ');
    console.log(`Row ${i} (${r.APELLIDO}, ${r.NOMBRE}): ${phoneVals}`);
  }
} else {
  console.log('No records found.');
}

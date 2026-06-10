const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backup', 'Tablas de Datos', 'PACIENTES.xls');
console.log('Reading:', filePath);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total records:', data.length);

// Let's get the union of all keys across all rows
const allKeys = new Set();
data.forEach(row => {
  Object.keys(row).forEach(k => allKeys.add(k));
});

console.log('Union of all columns across all rows:', Array.from(allKeys));

// Let's count how many rows have non-empty phone fields
const keyCounts = {};
Array.from(allKeys).forEach(k => {
  keyCounts[k] = 0;
});

data.forEach(row => {
  Object.keys(row).forEach(k => {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      keyCounts[k]++;
    }
  });
});

console.log('\nColumn counts (number of rows with non-empty values):');
Object.keys(keyCounts).sort((a,b) => keyCounts[b] - keyCounts[a]).forEach(k => {
  console.log(`- ${k}: ${keyCounts[k]} rows`);
});

// Look at a few real patients with NROHC > 0
const realPacs = data.filter(p => p.NROHC > 0);
console.log(`\nReal patients (NROHC > 0): ${realPacs.length}`);
if (realPacs.length > 0) {
  console.log('Sample real patient keys:', Object.keys(realPacs[0]));
  console.log('Sample real patient 0:', realPacs[0]);
  console.log('Sample real patient 1:', realPacs[1]);
  console.log('Sample real patient 2:', realPacs[2]);
}

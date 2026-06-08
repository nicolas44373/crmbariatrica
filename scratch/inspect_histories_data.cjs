const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const antWorkbook = XLSX.readFile(path.join(dataDir, 'CLI_ANTECEDENTES.xls'));
const antSheet = antWorkbook.Sheets[antWorkbook.SheetNames[0]];
const antData = XLSX.utils.sheet_to_json(antSheet);

console.log(`Analyzing ${antData.length} records in CLI_ANTECEDENTES.xls...`);

let issuesCount = 0;
antData.forEach((row, idx) => {
  let peso = row.PESO || 0;
  let alturaVal = row.ALTURA || 0;
  
  // Apply our scaling rules
  let origPeso = peso;
  let origAltura = alturaVal;
  
  if (peso > 1000) peso = peso / 1000;
  if (alturaVal > 0 && alturaVal < 3) {
    alturaVal = alturaVal * 100;
  }
  
  let imc = 0;
  if (peso > 0 && alturaVal > 0) {
    const hM = alturaVal / 100;
    imc = Number((peso / (hM * hM)).toFixed(2));
  }
  
  // Check if any value exceeds the numeric(5,2) limit (which is 999.99)
  // Wait, is it possible that weight or IMC is negative or has some formatting issues?
  // Let's print rows that look suspicious (e.g. imc > 200, weight > 500, or height < 50)
  if (peso > 300 || peso < 30 || alturaVal < 100 || alturaVal > 250 || imc > 100 || imc < 10) {
    if (issuesCount < 20) {
      console.log(`Suspicious Row index ${idx} (NROHC: ${row.NROHC}):`);
      console.log(`  Raw: PESO=${origPeso}, ALTURA=${origAltura}`);
      console.log(`  Processed: peso=${peso}, altura=${alturaVal}, imc=${imc}`);
      issuesCount++;
    }
  }
});

console.log('\nSample of the first 5 processed rows:');
for (let i = 0; i < 5; i++) {
  const row = antData[i];
  let peso = row.PESO || 0;
  let alturaVal = row.ALTURA || 0;
  if (peso > 1000) peso = peso / 1000;
  if (alturaVal > 0 && alturaVal < 3) alturaVal = alturaVal * 100;
  let imc = 0;
  if (peso > 0 && alturaVal > 0) {
    const hM = alturaVal / 100;
    imc = Number((peso / (hM * hM)).toFixed(2));
  }
  console.log(`Row ${i} (NROHC ${row.NROHC}): peso=${peso}, altura=${alturaVal}, imc=${imc}`);
}

const XLSX = require('xlsx');
const path = require('path');

const dataDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Tablas de Datos';
const workbook = XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows in BAR_DATOS.xls:', data.length);

let receptionCount = 0;
let entregaCount = 0;
let rtaFinanciadoraCount = 0;
let infCirujanoCount = 0;
let infNutricionCount = 0;
let infPsicologoCount = 0;

let matchedAny = 0;

for (const row of data) {
  let hasAny = false;
  if (row.FECHARECEPCION !== undefined && row.FECHARECEPCION !== null && row.FECHARECEPCION !== '') {
    receptionCount++;
    hasAny = true;
  }
  if (row.FECHAENTREGACARPETA !== undefined && row.FECHAENTREGACARPETA !== null && row.FECHAENTREGACARPETA !== '') {
    entregaCount++;
    hasAny = true;
  }
  if (row.FECHARTAFINANCIADORA !== undefined && row.FECHARTAFINANCIADORA !== null && row.FECHARTAFINANCIADORA !== '') {
    rtaFinanciadoraCount++;
    hasAny = true;
  }
  if (row.FECHAINFORMECIRUJANO !== undefined && row.FECHAINFORMECIRUJANO !== null && row.FECHAINFORMECIRUJANO !== '') {
    infCirujanoCount++;
    hasAny = true;
  }
  if (row.FECHAINFORMENUTRICION !== undefined && row.FECHAINFORMENUTRICION !== null && row.FECHAINFORMENUTRICION !== '') {
    infNutricionCount++;
    hasAny = true;
  }
  if (row.FECHAINFORMEPSICOLOGO !== undefined && row.FECHAINFORMEPSICOLOGO !== null && row.FECHAINFORMEPSICOLOGO !== '') {
    infPsicologoCount++;
    hasAny = true;
  }
  if (hasAny) {
    matchedAny++;
  }
}

console.log('FECHARECEPCION counts:', receptionCount);
console.log('FECHAENTREGACARPETA counts:', entregaCount);
console.log('FECHARTAFINANCIADORA counts:', rtaFinanciadoraCount);
console.log('FECHAINFORMECIRUJANO counts:', infCirujanoCount);
console.log('FECHAINFORMENUTRICION counts:', infNutricionCount);
console.log('FECHAINFORMEPSICOLOGO counts:', infPsicologoCount);
console.log('Total matched rows:', matchedAny);

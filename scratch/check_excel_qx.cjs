const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');
const masterDir = path.join(backupDir, 'Tablas Maestras');

function run() {
  console.log('--- Loading master surgery types ---');
  const tipoQxWorkbook = XLSX.readFile(path.join(masterDir, 'M_BAR_TIPOSCIRUGIA.xls'));
  const tipoQxSheet = tipoQxWorkbook.Sheets[tipoQxWorkbook.SheetNames[0]];
  const tipoQxData = XLSX.utils.sheet_to_json(tipoQxSheet);
  const tipoQxIdToName = {};
  tipoQxData.forEach(row => {
    tipoQxIdToName[row.ID] = row.TIPOCIRUGIA;
  });
  console.log('Master types:', tipoQxIdToName);

  console.log('\n--- Loading surgery logs ---');
  const barQxWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_CIRUGIA.xls'));
  const barQxSheet = barQxWorkbook.Sheets[barQxWorkbook.SheetNames[0]];
  const barQxData = XLSX.utils.sheet_to_json(barQxSheet);
  
  const stats = {
    total: 0,
    hasFechaQx: 0,
    hasOnlyFechaQxProg: 0,
    neither: 0,
    types: {}
  };

  barQxData.forEach(qx => {
    stats.total++;
    const qxTypeName = tipoQxIdToName[qx.TIPOQX] || 'Otra';
    stats.types[qxTypeName] = (stats.types[qxTypeName] || 0) + 1;

    if (qx.FECHAQX) {
      stats.hasFechaQx++;
    } else if (qx.FECHAQXPROGRAMADA) {
      stats.hasOnlyFechaQxProg++;
    } else {
      stats.neither++;
    }
  });

  console.log('Stats:', stats);
}

run();

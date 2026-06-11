const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');
const masterDir = path.join(backupDir, 'Tablas Maestras');

function run() {
  const tipoQxWorkbook = XLSX.readFile(path.join(masterDir, 'M_BAR_TIPOSCIRUGIA.xls'));
  const tipoQxSheet = tipoQxWorkbook.Sheets[tipoQxWorkbook.SheetNames[0]];
  const tipoQxData = XLSX.utils.sheet_to_json(tipoQxSheet);
  const tipoQxIdToName = {};
  tipoQxData.forEach(row => {
    tipoQxIdToName[row.ID] = row.TIPOCIRUGIA;
  });

  const barQxWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_CIRUGIA.xls'));
  const barQxSheet = barQxWorkbook.Sheets[barQxWorkbook.SheetNames[0]];
  const barQxData = XLSX.utils.sheet_to_json(barQxSheet);

  console.log('--- Cross-tabulation of raw types and date presence ---');
  
  const crosstab = {};

  barQxData.forEach(qx => {
    const qxTypeName = tipoQxIdToName[qx.TIPOQX] || 'Otra';
    
    let dateStatus = 'neither';
    if (qx.FECHAQX) {
      dateStatus = 'has_actual_date';
    } else if (qx.FECHAQXPROGRAMADA) {
      dateStatus = 'only_scheduled_date';
    }

    if (!crosstab[qxTypeName]) {
      crosstab[qxTypeName] = { has_actual_date: 0, only_scheduled_date: 0, neither: 0, total: 0 };
    }
    crosstab[qxTypeName][dateStatus]++;
    crosstab[qxTypeName].total++;
  });

  console.table(crosstab);
}

run();

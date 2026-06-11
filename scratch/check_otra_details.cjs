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

  function mapTipoQx(name) {
    if (!name) return 'Otra';
    const lower = name.toLowerCase();
    if (lower.includes('manga') || lower.includes('sleeve')) return 'Manga Gástrica';
    if (lower.includes('bypass') || lower.includes('by pass')) return 'Bypass Gástrico';
    if (lower.includes('sadi')) return 'SADI-S';
    if (lower.includes('balon') || lower.includes('balón')) return 'Balón Intragástrico';
    return 'Otra';
  }

  const otraFrequencies = {};

  barQxData.forEach(qx => {
    const qxTypeName = tipoQxIdToName[qx.TIPOQX] || 'Otra';
    const mapped = mapTipoQx(qxTypeName);
    if (mapped === 'Otra') {
      otraFrequencies[qxTypeName] = (otraFrequencies[qxTypeName] || 0) + 1;
    }
  });

  console.log('Frequencies of raw names that mapped to "Otra":');
  console.log(otraFrequencies);
}

run();

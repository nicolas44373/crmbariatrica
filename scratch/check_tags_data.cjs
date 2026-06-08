const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');
const masterDir = path.join(backupDir, 'Tablas Maestras');

try {
  // Read Master Tags
  const mTagsWb = XLSX.readFile(path.join(masterDir, 'M_ETIQUETAPACIENTE.xls'));
  const mTagsSheet = mTagsWb.Sheets[mTagsWb.SheetNames[0]];
  const mTagsData = XLSX.utils.sheet_to_json(mTagsSheet);
  console.log('--- Master Tags (M_ETIQUETAPACIENTE.xls) ---');
  console.log(mTagsData);

  // Read Patient Tags mapping
  const pTagsWb = XLSX.readFile(path.join(dataDir, 'PACIENTES_ETIQUETAS.xls'));
  const pTagsSheet = pTagsWb.Sheets[pTagsWb.SheetNames[0]];
  const pTagsData = XLSX.utils.sheet_to_json(pTagsSheet);
  console.log(`\nTotal patient-tag mappings: ${pTagsData.length}`);
  console.log('First 10 patient-tag mappings:');
  console.log(pTagsData.slice(0, 10));

} catch (err) {
  console.error('Error reading files:', err.message);
}

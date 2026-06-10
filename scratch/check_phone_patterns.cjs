const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);

let total = 0;
let hasWhatsapp = 0;
let hasTel = 0;
let hasTel2 = 0;

const sampleFormats = [];

pacientesData.forEach(p => {
  if (p.NROHC <= 0) return;
  total++;
  if (p.WHATSAPP) hasWhatsapp++;
  if (p.TEL) hasTel++;
  if (p.TEL2) hasTel2++;
  
  if (sampleFormats.length < 50 && (p.WHATSAPP || p.TEL || p.TEL2)) {
    sampleFormats.push({
      nrohc: p.NROHC,
      whatsapp: p.WHATSAPP,
      ddi: p.DDI,
      tel: p.TEL,
      tel2: p.TEL2,
      ddi2: p.DDI2
    });
  }
});

console.log(`Total active patients in Excel: ${total}`);
console.log(`Has WHATSAPP: ${hasWhatsapp}`);
console.log(`Has TEL: ${hasTel}`);
console.log(`Has TEL2: ${hasTel2}`);

console.log('\nSample formats:');
sampleFormats.forEach(s => {
  console.log(`HC: ${s.nrohc} | WSP: ${s.whatsapp} (DDI: ${s.ddi}) | TEL: ${s.tel} | TEL2: ${s.tel2} (DDI2: ${s.ddi2})`);
});

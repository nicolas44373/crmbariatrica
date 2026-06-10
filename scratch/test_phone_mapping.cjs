const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backup', 'Tablas de Datos', 'PACIENTES.xls');
console.log('Reading:', filePath);
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

const realPacs = data.filter(p => p.NROHC > 0);

function cleanPhone(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

function formatPhone(phone, ddi) {
  const cleaned = cleanPhone(phone);
  if (!cleaned || cleaned.length < 6) return '';
  
  const cleanedDdi = cleanPhone(ddi);
  if (cleaned.length < 10 && cleanedDdi && !cleaned.startsWith(cleanedDdi)) {
    return `${cleanedDdi}${cleaned}`;
  }
  return cleaned;
}

function getPatientPhone(p) {
  const whatsapp = formatPhone(p.WHATSAPP, p.DDI);
  if (whatsapp) return whatsapp;
  
  const tel2 = formatPhone(p.TEL2, p.DDI2 || p.DDI);
  if (tel2) return tel2;
  
  const tel = formatPhone(p.TEL, p.DDI);
  if (tel) return tel;
  
  return '';
}

function getPatientPhone2(p) {
  const mainPhone = getPatientPhone(p);
  const candidates = [
    formatPhone(p.WHATSAPP, p.DDI),
    formatPhone(p.TEL2, p.DDI2 || p.DDI),
    formatPhone(p.TEL, p.DDI)
  ].filter(val => val && val.length >= 6 && val !== mainPhone);
  
  return candidates[0] || null;
}

let withPhoneCount = 0;
let withPhone2Count = 0;

realPacs.forEach(p => {
  const ph = getPatientPhone(p);
  const ph2 = getPatientPhone2(p);
  if (ph) withPhoneCount++;
  if (ph2) withPhone2Count++;
});

console.log(`Total real patients: ${realPacs.length}`);
console.log(`Patients with primary phone: ${withPhoneCount} (${(withPhoneCount/realPacs.length*100).toFixed(1)}%)`);
console.log(`Patients with secondary phone: ${withPhone2Count} (${(withPhone2Count/realPacs.length*100).toFixed(1)}%)`);

console.log('\nSample mapping of first 30 patients:');
for (let i = 0; i < Math.min(30, realPacs.length); i++) {
  const p = realPacs[i];
  const ph = getPatientPhone(p);
  const ph2 = getPatientPhone2(p);
  console.log(`${i}. Name: ${p.APELLIDO}, ${p.NOMBRE} | Raw: TEL=${p.TEL}, TEL2=${p.TEL2}, WHATSAPP=${p.WHATSAPP}, DDI=${p.DDI} | Mapped: TEL1=${ph}, TEL2=${ph2}`);
}

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');
const plenusDir = path.join(backupDir, 'Plenus');

function isRTFEmptyHeader(content) {
  let temp = content
    .replace(/\\par/g, ' ')
    .replace(/\\b/g, ' ')
    .replace(/\\b0/g, ' ')
    .replace(/\\rt/g, ' ')
    .replace(/\\rtf\d*/g, ' ')
    .replace(/\{[^\}]*\}/g, ' ')
    .replace(/Paciente:\s*[^\\]*/i, '')
    .replace(/DNI:\s*[^\\]*/i, '')
    .replace(/NroHC:\s*[^\\]*/i, '')
    .replace(/Fecha:\s*[^\\]*/i, '')
    .replace(/\\ansi[^\s]*/g, '')
    .replace(/\\[a-z0-9]+/g, ' ')
    .replace(/[{}]/g, ' ')
    .trim();
  temp = temp.replace(/\s+/g, ' ').trim();
  return temp.length < 15;
}

function cleanName(name) {
  if (!name) return '';
  return name.replace(/^[\s\-\.]+/g, '').trim();
}

function run() {
  const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
  const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
  const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
  const realPatients = pacientesData.filter(p => p.NROHC > 0);

  const turnosWorkbook = XLSX.readFile(path.join(dataDir, 'TURNOS.xls'));
  const turnosSheet = turnosWorkbook.Sheets[turnosWorkbook.SheetNames[0]];
  const turnosData = XLSX.utils.sheet_to_json(turnosSheet);
  const turnosHcs = new Set(turnosData.map(t => t.ID_PACIENTE));

  const barDatosWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls'));
  const barDatosSheet = barDatosWorkbook.Sheets[barDatosWorkbook.SheetNames[0]];
  const barDatosData = XLSX.utils.sheet_to_json(barDatosSheet);
  const barDatosMap = {};
  barDatosData.forEach(row => {
    barDatosMap[row.ID] = row;
  });

  const barQxWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_CIRUGIA.xls'));
  const barQxSheet = barQxWorkbook.Sheets[barQxWorkbook.SheetNames[0]];
  const barQxData = XLSX.utils.sheet_to_json(barQxSheet);
  const patientsWithSurgeries = new Set();
  barQxData.forEach(qx => {
    const datosRow = barDatosMap[qx.ID_PROCEDIMIENTO];
    if (datosRow && datosRow.NROHC) {
      patientsWithSurgeries.add(datosRow.NROHC);
    }
  });

  const rtfFiles = fs.existsSync(plenusDir) ? fs.readdirSync(plenusDir) : [];
  const rtfNroHcs = new Set();
  rtfFiles.forEach(file => {
    const parts = file.split('-');
    if (parts.length < 2) return;
    const nrohc = parseInt(parts[0].trim(), 10);
    if (!isNaN(nrohc)) {
      const filePath = path.join(plenusDir, file);
      const content = fs.readFileSync(filePath, 'latin1');
      if (!isRTFEmptyHeader(content)) {
        rtfNroHcs.add(nrohc);
      }
    }
  });

  let skipCount = 0;
  let cleanCount = 0;
  let normalCount = 0;

  const toClean = [];
  const toSkip = [];

  realPatients.forEach(p => {
    const nrohc = p.NROHC;
    const hasHistory = rtfNroHcs.has(nrohc) || turnosHcs.has(nrohc) || patientsWithSurgeries.has(nrohc);
    const startWithSpecial = /^[-\.\s]/.test(p.APELLIDO || '') || /^[-\.\s]/.test(p.NOMBRE || '');

    if (startWithSpecial) {
      if (hasHistory) {
        cleanCount++;
        toClean.push(p);
      } else {
        skipCount++;
        toSkip.push(p);
      }
    } else {
      normalCount++;
    }
  });

  console.log(`Summary:`);
  console.log(`Normal patients: ${normalCount}`);
  console.log(`Patients to clean (special char with history): ${cleanCount}`);
  console.log(`Patients to skip (special char without history): ${skipCount}`);
  console.log(`Total: ${normalCount + cleanCount + skipCount} (vs ${realPatients.length} total in Excel)`);
  
  console.log('\nFirst 5 to clean:');
  toClean.slice(0, 5).forEach(p => console.log(`HC: ${p.NROHC} | Name: ${p.APELLIDO}, ${p.NOMBRE}`));
  
  console.log('\nFirst 5 to skip:');
  toSkip.slice(0, 5).forEach(p => console.log(`HC: ${p.NROHC} | Name: ${p.APELLIDO}, ${p.NOMBRE}`));
}

run();

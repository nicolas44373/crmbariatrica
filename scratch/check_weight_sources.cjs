const XLSX = require('xlsx');
const path = require('path');

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const cliAntecedentes = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(dataDir, 'CLI_ANTECEDENTES.xls')).Sheets['Sheet 1']);
const barDatos = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls')).Sheets['Sheet 1']);
const barControlPesoPre = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(dataDir, 'BAR_CONTROLPESOPRE.xls')).Sheets['Sheet 1']);

const setCli = new Set(cliAntecedentes.map(r => r.NROHC).filter(Boolean));
const setBar = new Set(barDatos.map(r => r.NROHC).filter(Boolean));
const setPre = new Set(barControlPesoPre.map(r => r.NROHC).filter(Boolean));

console.log(`Unique NROHC in CLI_ANTECEDENTES: ${setCli.size}`);
console.log(`Unique NROHC in BAR_DATOS: ${setBar.size}`);
console.log(`Unique NROHC in BAR_CONTROLPESOPRE: ${setPre.size}`);

// Combine all three
const union = new Set([...setCli, ...setBar, ...setPre]);
console.log(`Total unique NROHC with weight/height data in union: ${union.size}`);

// Check if any of these have weight/height data for 5716
console.log(`Does 5716 exist in CLI: ${setCli.has(5716)}`);
console.log(`Does 5716 exist in BAR: ${setBar.has(5716)}`);
console.log(`Does 5716 exist in PRE: ${setPre.has(5716)}`);

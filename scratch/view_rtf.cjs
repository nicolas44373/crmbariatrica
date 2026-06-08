const fs = require('fs');
const path = require('path');

const plenusDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Plenus';
const files = fs.readdirSync(plenusDir);
const targetFile = files.find(f => f.startsWith('5716'));

if (targetFile) {
  console.log(`Found file: ${targetFile}`);
  const filePath = path.join(plenusDir, targetFile);
  const raw = fs.readFileSync(filePath, 'latin1');
  console.log('\n--- Raw Content (first 1000 chars) ---');
  console.log(raw.substring(0, 1000));
} else {
  console.log('No file starting with 5716 found.');
}

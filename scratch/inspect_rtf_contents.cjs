const fs = require('fs');
const path = require('path');

const plenusDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Plenus';
const files = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));

console.log(`Total RTF files: ${files.length}`);

// Let's inspect 5 random files that are larger than 1KB, or just a sample of files.
const sortedFiles = files.map(f => {
  const stat = fs.statSync(path.join(plenusDir, f));
  return { name: f, size: stat.size };
}).sort((a, b) => b.size - a.size);

console.log('\nTop 5 largest files:');
sortedFiles.slice(0, 5).forEach(f => {
  console.log(`- ${f.name} (${f.size} bytes)`);
});

// Let's print the raw content of a large file
if (sortedFiles.length > 0) {
  const largeFile = sortedFiles[0].name;
  console.log(`\n=== Printing content of large file: ${largeFile} ===`);
  const raw = fs.readFileSync(path.join(plenusDir, largeFile), 'latin1');
  console.log(raw.substring(0, 1500));
}

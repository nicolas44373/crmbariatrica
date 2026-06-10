const fs = require('fs');
const path = require('path');

const plenusDir = path.join(__dirname, '..', 'backup', 'Plenus');
console.log('Plenus folder:', plenusDir);

if (!fs.existsSync(plenusDir)) {
  console.log('Plenus folder does not exist!');
  process.exit(1);
}

const files = fs.readdirSync(plenusDir);
console.log('Total files in Plenus folder:', files.length);

const matches = files.filter(f => f.startsWith('4523'));
console.log('Matches for 4523:', matches);

// Check if any match is found, print details
matches.forEach(file => {
  const filePath = path.join(plenusDir, file);
  const stats = fs.statSync(filePath);
  console.log(`File: ${file} | Size: ${stats.size} bytes`);
  
  // Print first 500 characters
  const content = fs.readFileSync(filePath, 'latin1');
  console.log('First 500 chars:\n', content.substring(0, 500));
});

// Let's also search for Salazar Lopez inside all files
console.log('\nSearching for "Salazar" case-insensitive in file names...');
const salazarFiles = files.filter(f => f.toLowerCase().includes('salazar'));
console.log('Salazar files:', salazarFiles);

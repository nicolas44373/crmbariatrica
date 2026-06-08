const fs = require('fs');
const path = require('path');

const plenusDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Plenus';
const files = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));

const regex = /\\b (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*\\b0/g;

let withEntries = 0;
let withoutEntries = 0;
let emptyHeaders = 0;
let others = 0;

const samplesWithout = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(plenusDir, file), 'latin1');
  
  // reset regex
  regex.lastIndex = 0;
  const match = regex.exec(content);
  
  if (match) {
    withEntries++;
  } else {
    withoutEntries++;
    
    // Check if it's just a header or if it contains other text
    // A header has Paciente, DNI, NroHC, Fecha
    // Let's strip the header parts and check if there's any other text
    let temp = content
      .replace(/\\par/g, ' ')
      .replace(/\\b/g, ' ')
      .replace(/\\b0/g, ' ')
      .replace(/\\rt/g, ' ')
      .replace(/\\rtf\d*/g, ' ')
      .replace(/\{[^\}]*\}/g, ' ') // remove group blocks like {\fonttbl...}
      .replace(/Paciente:\s*[^\\]*/i, '')
      .replace(/DNI:\s*[^\\]*/i, '')
      .replace(/NroHC:\s*[^\\]*/i, '')
      .replace(/Fecha:\s*[^\\]*/i, '')
      .replace(/\\ansi[^\s]*/g, '')
      .replace(/\\[a-z0-9]+/g, ' ')
      .replace(/[\{\}]/g, ' ')
      .trim();
      
    // remove non-printable / formatting noise
    temp = temp.replace(/\s+/g, ' ').trim();
    
    if (temp.length < 15) {
      emptyHeaders++;
    } else {
      others++;
      if (samplesWithout.length < 5) {
        samplesWithout.push({ file, content: content.substring(0, 500), cleaned: temp.substring(0, 200) });
      }
    }
  }
});

console.log(`Total files analyzed: ${files.length}`);
console.log(`Files with structured entries (regex matched): ${withEntries}`);
console.log(`Files without structured entries: ${withoutEntries}`);
console.log(`  - Of which are empty headers (no clinical content): ${emptyHeaders}`);
console.log(`  - Of which have other text: ${others}`);

if (samplesWithout.length > 0) {
  console.log('\nSamples of files without structured entries but having other text:');
  samplesWithout.forEach((s, i) => {
    console.log(`\nSample ${i+1}: ${s.file}`);
    console.log(`Raw snippet: ${s.content}`);
    console.log(`Cleaned text snippet: ${s.cleaned}`);
  });
}

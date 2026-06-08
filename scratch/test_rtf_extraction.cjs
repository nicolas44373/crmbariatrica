const fs = require('fs');
const path = require('path');

const plenusDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Plenus';
const files = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));

function extractWeightHeight(text) {
  let peso = null;
  let talla = null;
  
  // Weight regexes
  const wMatch1 = text.match(/Peso\s*\[kg\]:\s*(\d+(?:\.\d+)?)/i);
  const wMatch2 = text.match(/Peso:\s*(\d+(?:\.\d+)?)\s*(?:kg|kg\b)/i);
  const wMatch3 = text.match(/Peso\s*\(Control\):\s*(\d+(?:\.\d+)?)\s*(?:kg|kg\b)/i);
  
  if (wMatch1) peso = parseFloat(wMatch1[1]);
  else if (wMatch2) peso = parseFloat(wMatch2[1]);
  else if (wMatch3) peso = parseFloat(wMatch3[1]);
  
  // Height regexes
  const hMatch1 = text.match(/Estatura\s*\[cm\]:\s*(\d+)/i);
  const hMatch2 = text.match(/Estatura:\s*(\d+)\s*(?:cms|cm)/i);
  const hMatch3 = text.match(/Estatura:\s*(\d\.\d{2})\s*(?:m|mts)/i);
  
  if (hMatch1) talla = parseInt(hMatch1[1], 10);
  else if (hMatch2) talla = parseInt(hMatch2[1], 10);
  else if (hMatch3) talla = Math.round(parseFloat(hMatch3[1]) * 100);
  
  return { peso, talla };
}

let extractedCount = 0;
const samples = [];

files.slice(0, 1000).forEach(file => {
  const content = fs.readFileSync(path.join(plenusDir, file), 'latin1');
  const { peso, talla } = extractWeightHeight(content);
  if (peso || talla) {
    extractedCount++;
    if (samples.length < 5) {
      samples.push({ file, peso, talla });
    }
  }
});

console.log(`Analyzed 1000 files. Extracted data from ${extractedCount} files.`);
console.log('Samples of extracted data:');
console.log(samples);

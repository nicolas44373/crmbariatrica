const testStr1 = `\\b 2022-03-22 20:50  [JPM]\\b0   \\par\\par EVALUACION INICIAL`;
const testStr2 = `\\b  07/10/2025 18:08   [JPM]   (48a 11m)\\b0    Control de Primera Consulta`;

const regex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;

function test(str) {
  regex.lastIndex = 0;
  const match = regex.exec(str);
  if (match) {
    console.log(`Matched!`);
    console.log(`  Date: "${match[1]}"`);
    console.log(`  Author: "${match[2]}"`);
  } else {
    console.log(`Failed to match.`);
  }
}

console.log('Testing format 1:');
test(testStr1);

console.log('\nTesting format 2:');
test(testStr2);

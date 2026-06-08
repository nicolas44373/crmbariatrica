const fs = require('fs');
const path = require('path');

const plenusDir = 'c:/Users/nicol/Desktop/programacion/crm/backup/Plenus';
const largeFile = '875 - CANARINI, GERMAN ALFREDO - 34764953.rtf';
const content = fs.readFileSync(path.join(plenusDir, largeFile), 'latin1');

function cleanRTF(text) {
  if (!text) return '';
  
  // 1. Remove RTF tags
  let clean = text
    .replace(/\\par/g, '\n')
    .replace(/\\b\d*/g, '')
    .replace(/\\b0/g, '')
    .replace(/\\f\d*/g, '')
    .replace(/\\fs\d*/g, '')
    .replace(/\\ql/g, '')
    .replace(/\\uc\d*/g, '')
    .replace(/\\bullet/g, '•')
    .replace(/\\tab/g, '\t');
    
  // 2. Decode hex escapes like \'e1
  clean = clean.replace(/\\\'([0-9a-fA-F]{2})/g, (match, hex) => {
    try {
      return Buffer.from(hex, 'hex').toString('latin1');
    } catch (e) {
      return match;
    }
  });

  // 3. Decode unicode characters like \u241?
  clean = clean.replace(/\\u(\d+)\??/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // 4. Fix double encoding / mojibake
  clean = clean
    .replace(/\u00c3\u00a1/g, 'á')
    .replace(/\u00c3\u00a9/g, 'é')
    .replace(/\u00c3\u00ad/g, 'í')
    .replace(/\u00c3\u00b3/g, 'ó')
    .replace(/\u00c3\u00ba/g, 'ú')
    .replace(/\u00c3\u00b1/g, 'ñ')
    .replace(/\u00c3\u0091/g, 'Ñ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã‘/g, 'Ñ');

  clean = clean
    .replace(/\u00c3\u0192\u00c2\u00b3/g, 'ó')
    .replace(/\u00c3\u0192\u00c2\u00a1/g, 'á')
    .replace(/\u00c3\u0192\u00c2\u00a9/g, 'é')
    .replace(/\u00c3\u0192\u00c2\u00ad/g, 'í')
    .replace(/\u00c3\u0192\u00c2\u00ba/g, 'ú')
    .replace(/\u00c3\u0192\u00c2\u00b1/g, 'ñ')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ');

  // 5. Clean up HTML entities and tags
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Remove other control words
  clean = clean
    .replace(/\\[a-z0-9]+/g, ' ')  // Remove remaining \control tags
    .replace(/[{}]/g, ' ')         // Remove braces
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return clean;
}

// Unified regex
const regex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;

let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
  matches.push({
    dateStr: match[1],
    authorInitials: match[2] || '',
    index: match.index,
    headerLength: match[0].length
  });
}

console.log(`Found ${matches.length} entries.`);
for (let i = 0; i < matches.length; i++) {
  const start = matches[i].index + matches[i].headerLength;
  const end = (i + 1 < matches.length) ? matches[i + 1].index : content.length;
  
  const rawContent = content.slice(start, end);
  const cleaned = cleanRTF(rawContent);
  console.log(`\nEntry ${i+1}: Date=${matches[i].dateStr}, Author=${matches[i].authorInitials}`);
  console.log(`Cleaned:\n${cleaned.substring(0, 300)}...`);
}

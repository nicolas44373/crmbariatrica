const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\nicol\\.gemini\\antigravity\\brain\\6eb997c2-239a-4a71-b67f-8f9bfb0686d5\\.system_generated\\logs\\transcript_full.jsonl';

async function search() {
  if (!fs.existsSync(logPath)) {
    console.error('File does not exist:', logPath);
    return;
  }
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.includes('Hematocrito') && line.includes('GLAE')) {
      console.log(`Found matching line in transcript_full.jsonl at line ${lineNum}:`);
      try {
        const parsed = JSON.parse(line);
        console.log('Type:', parsed.type);
        console.log('Content:\n', parsed.content);
      } catch (e) {
        console.log(line);
      }
      break;
    }
  }
}

search();

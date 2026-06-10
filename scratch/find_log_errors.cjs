const fs = require('fs');
const path = require('path');

const logPath = path.join('C:', 'Users', 'nicol', '.gemini', 'antigravity', 'brain', '6eb997c2-239a-4a71-b67f-8f9bfb0686d5', '.system_generated', 'tasks', 'task-1551.log');
console.log('Reading log:', logPath);

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist!');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');
console.log('Total log lines:', lines.length);

console.log('\nError lines found:');
let errorCount = 0;
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
    errorCount++;
    if (errorCount <= 100) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
console.log(`Total error/fail lines: ${errorCount}`);

// Let's search specifically for P-4523 or 4523 in the log
console.log('\nMentions of "4523" in the log:');
lines.forEach((line, idx) => {
  if (line.includes('4523')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

const fs = require('fs');
const path = require('path');

const logPath = path.join('C:', 'Users', 'nicol', '.gemini', 'antigravity', 'brain', '6eb997c2-239a-4a71-b67f-8f9bfb0686d5', '.system_generated', 'tasks', 'task-1551.log');

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  console.log('--- LOG FILE CONTENT ---');
  console.log(content);
} else {
  console.log('Log file does not exist at:', logPath);
}

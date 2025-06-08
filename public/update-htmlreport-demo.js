const fs = require('fs');
const path = require('path');

const N = 3; // Number of entries to update
const filePath = path.join(__dirname, 'automationrunlogs.json');
const DEMO_REPORT = '/mock-data/run-report-1749308558688.html';

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

for (let i = 0; i < Math.min(N, data.length); i++) {
  data[i].htmlReport = DEMO_REPORT;
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log(`Updated htmlReport for first ${N} entries.`); 
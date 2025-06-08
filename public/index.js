const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const WebSocket = require('ws');
const { generateReport } = require('./report-template');

const app = express();
app.use(express.json());
app.use(cors());

// Serve screenshots and reports statically
app.use('/api/screenshots', express.static(path.join(__dirname, 'screenshots')));
app.use('/api/reports', express.static(path.join(__dirname, 'screenshots')));

// Serve manual-tests.json statically
app.use(express.static(__dirname));

const HISTORY_FILE = path.join(__dirname, 'automation-history.json');
const AUTOMATION_RUN_LOGS = path.join(__dirname, 'automationrunlogs.json');

const settings = JSON.parse(fs.readFileSync('/Users/pournima/Documents/Zap Release 1/ZapDashboard/zap-app/mock-api/data/applicationsettings.json', 'utf-8'));
const JIRA_BASE_URL = settings.jira.url.replace(/\/$/, '');
const JIRA_EMAIL = settings.jira.username;
const JIRA_API_TOKEN = settings.jira.apiToken;

const manualTestPort = 4050;
const wss = new WebSocket.Server({ port: manualTestPort });

function appendToHistory(run) {
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
      history = [];
    }
  }
  history.push(run);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function appendToRunLogs(run) {
  let logs = [];
  if (fs.existsSync(AUTOMATION_RUN_LOGS)) {
    try {
      logs = JSON.parse(fs.readFileSync(AUTOMATION_RUN_LOGS, 'utf-8'));
    } catch (e) {
      logs = [];
    }
  }
  logs.push(run);
  fs.writeFileSync(AUTOMATION_RUN_LOGS, JSON.stringify(logs, null, 2));
}

app.get('/api/automation-history', (req, res) => {
  if (!fs.existsSync(HISTORY_FILE)) return res.json([]);
  try {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    res.json(history);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read history' });
  }
});

// Updated function to fetch and parse Jira test steps
async function getTestStepsFromJira(jiraId) {
  // 1. Fetch the Jira issue
  const response = await fetch(
    `${JIRA_BASE_URL}/rest/api/3/issue/${jiraId}`,
    {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64'),
        'Accept': 'application/json'
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch Jira issue');
  const data = await response.json();

  // 2. Extract description and steps (customize this for your Jira fields)
  const description = data.fields.description?.content?.map(block => block.content?.map(c => c.text).join('')).join('\n') || '';
  // If you use a custom field for steps, extract it here

  // 3. Parse steps from description (simple example: look for numbered lines)
  const stepRegex = /^\d+\.\s+(.*)$/gm;
  const steps = [];
  let match;
  while ((match = stepRegex.exec(description)) !== null) {
    steps.push(match[1]);
  }

  // 4. Convert steps to Playwright actions (customize this logic!)
  // Example for your Google test case:
  const playwrightSteps = [
    { action: 'goto', url: 'https://google.com', name: steps[0] || 'Open Google page' },
    { action: 'fill', selector: 'input[name="q"]', value: 'Blogs | QA Pournima', name: steps[1] || 'Search for Blogs | QA Pournima' },
    { action: 'press', key: 'Enter', name: 'Submit search' },
    { action: 'click', selector: 'a[href*="qa-pournima"]', name: steps[2] || 'Open the blog page' },
    { action: 'click', selector: '.like-icon', name: steps[3] || 'Click on the like icon' }
  ];

  return {
    description,
    steps: playwrightSteps
  };
}

async function runTestCase(steps, jiraId) {
  // Clean up old screenshots
  const screenshotsDir = path.join(__dirname, 'screenshots');
  fs.readdirSync(screenshotsDir).forEach(f => fs.unlinkSync(path.join(screenshotsDir, f)));

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const stepResults = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let screenshotFile = `step-${i + 1}.png`;
    try {
      if (step.action === 'goto') {
        await page.goto(step.url);
      } else if (step.action === 'fill') {
        await page.fill(step.selector, step.value);
      } else if (step.action === 'click') {
        await page.click(step.selector);
      } else if (step.action === 'waitForSelector') {
        await page.waitForSelector(step.selector, { timeout: 10000 });
      } else if (step.action === 'press') {
        await page.keyboard.press(step.key);
      }
      await page.screenshot({ path: path.join(screenshotsDir, screenshotFile) });
      stepResults.push({ ...step, status: 'passed', screenshot: `/api/screenshots/${screenshotFile}` });
    } catch (err) {
      screenshotFile = `step-${i + 1}-error.png`;
      await page.screenshot({ path: path.join(screenshotsDir, screenshotFile) });
      stepResults.push({ ...step, status: 'failed', error: err.message, screenshot: `/api/screenshots/${screenshotFile}` });
      break;
    }
  }
  await browser.close();
  return stepResults;
}

app.post('/api/execute-test/:jiraId', async (req, res) => {
  const { jiraId } = req.params;
  try {
    // 1. Fetch test steps and description for this Jira test case
    const { description, steps } = await getTestStepsFromJira(jiraId);
    // 2. Run the test
    const results = await runTestCase(steps, jiraId);
    const testCaseName = `Test Case ${jiraId}`;
    // 3. Save to history
    const run = {
      jiraId,
      testCaseName,
      timestamp: new Date().toISOString(),
      description,
      steps,
      results
    };
    appendToHistory(run);
    // 4. Return the results
    res.json({ success: true, results, testCaseName, description, steps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

wss.on('connection', ws => {
  (async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Expose a function to receive events from the browser
    await page.exposeFunction('recordAction', action => {
      ws.send(JSON.stringify(action));
    });

    // Inject a script to listen for user actions and navigation
    await page.addInitScript(() => {
      // Robust selector generator (inspired by Playwright codegen)
      function getSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el === document.body) return 'body';
        let path = [];
        while (el && el.nodeType === 1 && el !== document.body) {
          let selector = el.nodeName.toLowerCase();
          if (el.className) selector += '.' + Array.from(el.classList).join('.');
          let sib = el, nth = 1;
          while ((sib = sib.previousElementSibling)) {
            if (sib.nodeName === el.nodeName) nth++;
          }
          if (nth > 1) selector += `:nth-of-type(${nth})`;
          path.unshift(selector);
          el = el.parentElement;
        }
        return path.length ? path.join(' > ') : null;
      }
      document.addEventListener('click', e => {
        window.recordAction({
          type: 'click',
          selector: getSelector(e.target),
          tag: e.target.tagName
        });
      });
      document.addEventListener('input', e => {
        window.recordAction({
          type: 'input',
          selector: getSelector(e.target),
          value: e.target.value,
          tag: e.target.tagName
        });
      });
      document.addEventListener('change', e => {
        window.recordAction({
          type: 'change',
          selector: getSelector(e.target),
          value: e.target.value,
          tag: e.target.tagName
        });
      });
      document.addEventListener('keydown', e => {
        window.recordAction({
          type: 'keydown',
          selector: getSelector(e.target),
          key: e.key,
          tag: e.target.tagName
        });
      });
      // Navigation events
      window.addEventListener('popstate', () => {
        window.recordAction({
          type: 'navigation',
          url: window.location.href
        });
      });
      // Also record initial navigation
      window.recordAction({
        type: 'navigation',
        url: window.location.href
      });
    });

    // Listen for Playwright navigation events
    page.on('framenavigated', frame => {
      ws.send(JSON.stringify({
        type: 'navigation',
        url: frame.url()
      }));
    });

    await page.goto('https://google.com'); // Or any start URL

    ws.on('close', async () => {
      await browser.close();
    });
  })();
});

// Endpoint to trigger manual test session (optional, for frontend to call)
app.post('/api/start-manual-test', (req, res) => {
  // The WebSocket server will handle the session when the frontend connects
  res.json({ wsUrl: `ws://localhost:${manualTestPort}` });
});

app.post('/api/save-steps', (req, res) => {
  console.log('[API] /api/save-steps called');
  try {
    console.log('[API] /api/save-steps received body:', req.body);
    const { steps, name } = req.body;
    const file = path.join(__dirname, 'manual-tests.json');
    let all = [];
    if (fs.existsSync(file)) {
      all = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    all.push({ name: name || `Manual Test ${all.length + 1}`, steps, timestamp: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(all, null, 2));
    console.log('[API] /api/save-steps saved test:', name || `Manual Test ${all.length}`);
    res.json({ success: true });
  } catch (e) {
    console.error('[API] /api/save-steps error:', e);
    res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/manual-tests.json', (req, res) => {
  const file = path.join(__dirname, 'manual-tests.json');
  if (!fs.existsSync(file)) return res.json([]);
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read manual test history' });
  }
});

// DELETE endpoint for removing tests by timestamp
app.delete('/api/delete-automated-tests', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ success: false, error: 'ids must be an array' });
    const file = path.join(__dirname, 'manual-tests.json');
    let all = [];
    if (fs.existsSync(file)) {
      all = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    const filtered = all.filter(test => !ids.includes(test.timestamp));
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/create-bug', (req, res) => {
  try {
    const { jiraId, description } = req.body;
    console.log(`[API] /api/create-bug: JiraID=${jiraId}, Description=\n${description}`);
    res.json({ success: true });
  } catch (e) {
    console.error('[API] /api/create-bug error:', e);
    res.status(400).json({ success: false, error: e.message });
  }
});

app.post('/api/run-automation-test', async (req, res) => {
  try {
    const { steps, name, testId } = req.body;
    // If testId is provided, load steps from manual-tests.json
    let testSteps = steps;
    let testName = name;
    if (testId) {
      const tests = JSON.parse(fs.readFileSync(path.join(__dirname, 'manual-tests.json'), 'utf-8'));
      const test = tests.find(t => t.timestamp === testId);
      if (!test) return res.status(404).json({ success: false, error: 'Test not found' });
      testSteps = test.steps;
      testName = test.name;
    }
    // Run Playwright in headless mode
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const stepResults = [];
    let htmlReport = '';
    for (let i = 0; i < testSteps.length; i++) {
      const step = testSteps[i];
      let screenshotFile = `run-${Date.now()}-step-${i + 1}.png`;
      let status = 'passed';
      let error = '';
      try {
        if (step.type === 'navigation' && step.url) {
          await page.goto(step.url);
        } else if (step.type === 'fill') {
          await page.fill(step.selector, step.value);
        } else if (step.type === 'click') {
          await page.click(step.selector);
        } else if (step.type === 'waitForSelector') {
          await page.waitForSelector(step.selector, { timeout: 10000 });
        } else if (step.type === 'press') {
          await page.keyboard.press(step.key);
        }
        await page.screenshot({ path: path.join(__dirname, 'screenshots', screenshotFile) });
      } catch (err) {
        status = 'failed';
        error = err.message;
        await page.screenshot({ path: path.join(__dirname, 'screenshots', screenshotFile) });
      }
      stepResults.push({ ...step, status, error, screenshot: `/api/screenshots/${screenshotFile}` });
      if (status === 'failed') break;
    }
    await browser.close();
    // Generate HTML report
    const reportFile = `run-report-${Date.now()}.html`;
    const reportPath = path.join(__dirname, 'screenshots', reportFile);
    const html = generateReport(testName, stepResults);
    fs.writeFileSync(reportPath, html);
    htmlReport = `/api/reports/${reportFile}`;
    // Save run log
    const runLog = {
      name: testName,
      testId: testId || null,
      timestamp: new Date().toISOString(),
      steps: stepResults,
      htmlReport,
      status: stepResults.some(s => s.status === 'failed') ? 'failed' : 'passed'
    };
    appendToRunLogs(runLog);
    res.json({ success: true, run: runLog });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE endpoint for removing automation test runs by timestamp
app.delete('/api/delete-automation-test-runs', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ success: false, error: 'ids must be an array' });
    const file = path.join(__dirname, 'automationrunlogs.json');
    let all = [];
    if (fs.existsSync(file)) {
      all = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    const filtered = all.filter(run => !ids.includes(run.timestamp));
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/update-manual-test', (req, res) => {
  try {
    const { timestamp, name, steps } = req.body;
    if (!timestamp || !Array.isArray(steps)) {
      return res.status(400).json({ success: false, error: 'timestamp and steps are required' });
    }
    const file = path.join(__dirname, 'manual-tests.json');
    let all = [];
    if (fs.existsSync(file)) {
      all = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    const idx = all.findIndex(t => t.timestamp === timestamp);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    all[idx].name = name || all[idx].name;
    all[idx].steps = steps;
    fs.writeFileSync(file, JSON.stringify(all, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Serve the mock HTML report at a fixed endpoint for prototype/demo
app.get('/api/mock-report', (req, res) => {
  res.sendFile(path.join(__dirname, 'run-report-1749308558688.html'));
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Automation backend listening on port ${PORT}`);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
}); 
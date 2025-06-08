const generateReport = (testName, stepResults) => {
  const totalSteps = stepResults.length;
  const passedSteps = stepResults.filter(s => s.status === 'passed').length;
  const failedSteps = totalSteps - passedSteps;
  const passRate = ((passedSteps / totalSteps) * 100).toFixed(1);

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${testName} Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .summary-card h3 {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    .summary-card .value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .steps {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .step {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }
    .step:last-child {
      border-bottom: none;
    }
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .step-type {
      font-weight: bold;
      color: #666;
    }
    .step-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    .step-status.passed {
      background: #d4edda;
      color: #155724;
    }
    .step-status.failed {
      background: #f8d7da;
      color: #721c24;
    }
    .step-details {
      margin: 10px 0;
    }
    .step-screenshot {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin-top: 10px;
    }
    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
      font-family: monospace;
      white-space: pre-wrap;
    }
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      .summary {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${testName}</h1>
    <p>Test Run Report</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Steps</h3>
      <div class="value">${totalSteps}</div>
    </div>
    <div class="summary-card">
      <h3>Passed Steps</h3>
      <div class="value passed">${passedSteps}</div>
    </div>
    <div class="summary-card">
      <h3>Failed Steps</h3>
      <div class="value failed">${failedSteps}</div>
    </div>
    <div class="summary-card">
      <h3>Pass Rate</h3>
      <div class="value">${passRate}%</div>
    </div>
  </div>

  <div class="steps">
    ${stepResults.map((step, index) => `
      <div class="step">
        <div class="step-header">
          <span class="step-type">Step ${index + 1}: ${step.type}</span>
          <span class="step-status ${step.status}">${step.status}</span>
        </div>
        <div class="step-details">
          ${step.url ? `<div>URL: ${step.url}</div>` : ''}
          ${step.selector ? `<div>Selector: ${step.selector}</div>` : ''}
          ${step.value ? `<div>Value: ${step.value}</div>` : ''}
          ${step.screenshot ? `<img class="step-screenshot" src="${step.screenshot}" alt="Step ${index + 1} screenshot">` : ''}
          ${step.error ? `<div class="error-message">${step.error}</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
};

module.exports = { generateReport }; 
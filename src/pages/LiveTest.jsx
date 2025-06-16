import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { logActivity } from '../utils/activityLogger';
import manualTestSteps from '../mock-data/manualTestSteps.json';

const API_URL = 'http://localhost:4001/api/execute-test';

const stepTypes = [
  { value: 'click', label: 'Click' },
  { value: 'input', label: 'Input' },
  { value: 'navigation', label: 'Navigation' },
];

export default function LiveTest() {
  const { jiraId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromMySprint = new URLSearchParams(location.search).get('fromMySprint') === '1';
  const testCaseNameFromQuery = new URLSearchParams(location.search).get('name') || '';
  const isManual = new URLSearchParams(location.search).get('manual') === '1';
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [testCaseName, setTestCaseName] = useState(testCaseNameFromQuery);
  const [testResult, setTestResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const wsRef = useRef(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [manualTestStarted, setManualTestStarted] = useState(false);
  const [manualTestHistory, setManualTestHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [manualTestComplete, setManualTestComplete] = useState(false);
  const [editingStepIdx, setEditingStepIdx] = useState(null);
  const [editingStep, setEditingStep] = useState({ type: '', selector: '', value: '' });
  const [addStepIdx, setAddStepIdx] = useState(null);
  const [newStep, setNewStep] = useState({ type: 'click', selector: '', value: '' });
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugStatus, setBugStatus] = useState('');
  const [manualStatus, setManualStatus] = useState('Not Started');
  const [testCancelled, setTestCancelled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [testState, setTestState] = useState('idle'); // 'idle', 'running', 'completed', 'cancelled'

  useEffect(() => {
    if (!jiraId || isManual) return; // Skip API call for manual test
    setLoading(true);
    setError(null);
    setResults(null);
    setTestCaseName('');
    // Fetch static demo data from public folder
    fetch('/demo-automated-test.json')
      .then(res => res.json())
      .then(data => {
        setResults(data.results);
        setTestCaseName(data.testCaseName || jiraId);
        setTestResult(data);
      })
      .catch(err => {
        setError(err.message || 'Test execution failed');
      })
      .finally(() => setLoading(false));
  }, [jiraId, isManual]);

  // Manual test WebSocket connection (DISABLED FOR DEMO)
  // useEffect(() => {
  //   if (!manualTestStarted) return;
  //   setManualTestComplete(false);
  //   const ws = new window.WebSocket('ws://localhost:4050');
  //   wsRef.current = ws;
  //   ws.onmessage = (event) => {
  //     const action = JSON.parse(event.data);
  //     setSteps(prev => [...prev, action]);
  //   };
  //   ws.onclose = async () => {
  //     setManualTestComplete(true);
  //     setManualTestStarted(false);
  //     console.log('Manual test WebSocket closed');
  //     // Log manual test run to activity logs
  //     let status = manualStatus.toLowerCase();
  //     if (status === 'completed') status = 'done';
  //     else if (status === 'failed') status = 'failed';
  //     else status = 'in progress';
  //     await logActivity({
  //       title: `Manual Test Run: ${testCaseName}`,
  //       description: `Manual test execution for ${testCaseName}`,
  //       'Request Type': 'Test Case',
  //       status,
  //       'Output Type': 'Test Report',
  //       createdDate: new Date().toISOString().split('T')[0]
  //     });
  //   };
  //   return () => ws.close();
  // }, [manualTestStarted]);

  // Fetch manual test history
  const fetchManualTestHistory = () => {
    fetch('/manual-tests.json')
      .then(res => res.json())
      .then(data => setManualTestHistory(data.reverse())) // show most recent first
      .catch(() => setManualTestHistory([]));
  };

  // Save steps as automated test (simulate success)
  const saveSteps = () => {
    setSaveMessage('');
    setSaving(true);
    setTimeout(() => {
      setSaveMessage('Saved as automated test!');
      setStatusMessage('Test saved as Automated Test!');
      fetchManualTestHistory();
      setManualTestComplete(true);
      setManualTestStarted(false);
      setManualStatus('Completed');
      setSaving(false);
    }, 500);
  };

  // Fetch history on mount
  useEffect(() => {
    fetchManualTestHistory();
  }, []);

  // Determine status
  let status = 'In Progress';
  if (results) {
    if (results.some(step => step.status === 'failed')) status = 'Failed';
    else if (results.every(step => step.status === 'passed')) status = 'Passed';
    else status = 'In Progress';
  }

  // Get latest screenshot
  const latestScreenshot = results && results.length > 0 ? results[results.length - 1].screenshot : null;

  // Helper to group input steps by selector and show only the final value
  const formattedSteps = [];
  const lastInputBySelector = {};
  steps.forEach((step, idx) => {
    if (step.type === 'input') {
      lastInputBySelector[step.selector] = { ...step, idx };
    } else {
      formattedSteps.push({ ...step, idx });
    }
  });
  // Add the last input for each selector
  Object.values(lastInputBySelector).forEach(inputStep => {
    formattedSteps.push(inputStep);
  });
  // Sort by original order
  formattedSteps.sort((a, b) => a.idx - b.idx);

  // Remove a step
  const removeStep = idx => {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };
  // Move step up/down
  const moveStep = (idx, dir) => {
    setSteps(prev => {
      const arr = [...prev];
      const [removed] = arr.splice(idx, 1);
      arr.splice(idx + dir, 0, removed);
      return arr;
    });
  };
  // Start editing a step
  const startEditStep = (idx, step) => {
    setEditingStepIdx(idx);
    setEditingStep({ type: step.type, selector: step.selector || '', value: step.value || '' });
  };
  // Save edited value
  const saveEditStep = idx => {
    setSteps(prev => prev.map((step, i) => i === idx ? { ...step, ...editingStep } : step));
    setEditingStepIdx(null);
    setEditingStep({ type: '', selector: '', value: '' });
  };
  // Cancel editing
  const cancelEditStep = () => {
    setEditingStepIdx(null);
    setEditingStep({ type: '', selector: '', value: '' });
  };
  // Cancel/Restart manual test
  const cancelManualTest = () => {
    setManualTestStarted(false);
    setManualTestComplete(false);
    setSteps([]);
    setSaveMessage('');
    setManualStatus('Stopped');
    setTestCancelled(true);
    setStatusMessage('Test process cancelled.');
    setTestState('cancelled');
  };
  const restartManualTest = () => {
    setManualTestStarted(false);
    setManualTestComplete(false);
    setSteps([]);
    setSaveMessage('');
    setTimeout(() => setManualTestStarted(true), 100);
  };

  // Auto-start manual test if jiraId is present
  useEffect(() => {
    if (jiraId && !manualTestStarted) {
      setManualTestStarted(true);
    }
  }, [jiraId]);

  // Format steps for bug description
  const formatStepsForBug = () =>
    formattedSteps.map((step, idx) =>
      `${idx + 1}. [${step.type}] ${step.selector || step.url}${step.value ? ' = ' + step.value : ''}`
    ).join('\n');

  const openBugModal = () => {
    setBugDescription(formatStepsForBug());
    setShowBugModal(true);
    setBugStatus('');
  };
  const closeBugModal = () => setShowBugModal(false);
  // Simulate bug creation
  const submitBug = () => {
    setBugStatus('');
    setTimeout(() => {
      setBugStatus('Bug created successfully!');
    }, 500);
  };

  const startManualTest = () => {
    setSteps(manualTestSteps);
    setManualTestStarted(true);
    setManualStatus('In Progress');
  };

  const handleStartNewTest = () => {
    setManualTestStarted(false);
    setManualTestComplete(false);
    setSteps([]);
    setSaveMessage('');
    setManualStatus('Not Started');
    setTestCancelled(false);
    setStatusMessage('');
    setTestState('running');
    setTestCaseName('');
    setResults(null);
    setError(null);
    setTestResult(null);
    // Remove jiraId and query params from URL
    navigate(`/live-test`, { replace: true });
  };

  // Add step handlers:
  const startAddStep = idx => {
    setAddStepIdx(idx);
    setNewStep({ type: 'click', selector: '', value: '' });
  };
  const saveAddStep = idx => {
    if (!newStep.selector && !newStep.value) return; // Prevent adding empty step
    setSteps(prev => {
      const arr = [...prev];
      arr.splice(idx + 1, 0, { ...newStep });
      return arr;
    });
    setAddStepIdx(null);
    setNewStep({ type: 'click', selector: '', value: '' });
  };
  const cancelAddStep = () => {
    setAddStepIdx(null);
    setNewStep({ type: 'click', selector: '', value: '' });
  };

  return (
    <div className=" mt-8 min-h-screen bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-8">
      {fromMySprint && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded border border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
          Manual test process started from My Sprint. Please follow the steps below to execute your test.
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">Live Test Execution</h2>
      <div className="mb-2 text-lg font-semibold">Test Case: <span className="text-blue-600 dark:text-blue-300">{testCaseName}</span></div>
      <div className="mb-4 flex items-center gap-4">
        <span>Status: </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          manualStatus === 'Completed'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : manualStatus === 'In Progress'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : manualStatus === 'Stopped'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-gray-200'
        }`}>{manualStatus}</span>
      </div>
      {statusMessage && <div className="mb-4 text-green-600 text-lg">{statusMessage}</div>}
      {loading && <div className="text-blue-500">Running test...</div>}
      {error && (
        <div className="text-red-500">
          {error.includes('Target page, context or browser has been closed')
            ? 'The test browser was closed. Please restart the test to try again.'
            : error}
        </div>
      )}
      {latestScreenshot && (
        <div className="mb-6">
          <div className="font-medium mb-2">Live UI:</div>
          <img src={latestScreenshot} alt="Live Test UI" className="border rounded shadow max-w-xl w-full bg-white" style={{ minHeight: 200 }} />
        </div>
      )}
      {testResult && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Test Case Details</h3>
          <div>
            <strong>Description:</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{testResult.description}</pre>
          </div>
          <div>
            <strong>Steps:</strong>
            <ol>
              {testResult.steps.map((step, idx) => {
                const result = testResult.results[idx];
                let status = result?.status || 'skipped';
                let color = status === 'passed' ? 'green' : status === 'failed' ? 'red' : 'gray';
                return (
                  <li key={idx} style={{ marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold' }}>{step.name}</span>
                    <span style={{ color, marginLeft: 8 }}>
                      [{status}]
                    </span>
                    {result?.screenshot && (
                      <div>
                        <img src={result.screenshot} alt="step screenshot" width={120} />
                      </div>
                    )}
                    {result?.error && (
                      <div style={{ color: 'red' }}>{result.error}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
      <div className="mt-8">
        {(testState === 'idle' || testState === 'running') && (
          <button
            onClick={startManualTest}
            className={`mb-4 px-4 py-2 rounded ${
              manualTestStarted && !saving
                ? 'bg-green-600'
                : 'bg-blue-600'
            } text-white`}
            disabled={manualTestStarted || manualTestComplete || saving}
          >
            {manualTestComplete
              ? 'Manual Test Complete'
              : saving
                ? 'Manual Test'
                : manualTestStarted
                  ? 'Manual Test Running...'
                  : 'Start Manual Test (Demo Steps)'}
          </button>
        )}
        {(manualTestStarted || manualTestComplete) && !testCancelled && testState !== 'completed' && testState !== 'cancelled' && (
          <>
            <button onClick={cancelManualTest} className="ml-2 px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
            <button onClick={restartManualTest} className="ml-2 px-4 py-2 bg-yellow-500 text-white rounded">Restart</button>
          </>
        )}
        {manualTestStarted && !testCancelled && testState !== 'completed' && testState !== 'cancelled' && (
          <>
            <h3 className="text-lg font-semibold mb-2">Manual Test Recording  (Live browser will open and based on the browser actions, the steps will be recorded)</h3>
            <ol className="space-y-2">
              {manualTestStarted && manualStatus === 'In Progress' && formattedSteps.map((step, idx) => (
                <li key={idx} className="p-2 rounded bg-neutral-100 dark:bg-neutral-800 flex flex-col md:flex-row md:items-center gap-2">
                  {editingStepIdx === idx ? (
                    <>
                      <select
                        className="px-2 py-1 rounded text-xs bg-gray-800 text-white dark:bg-gray-800 dark:text-white border border-gray-600"
                        value={editingStep.type}
                        onChange={e => setEditingStep(s => ({ ...s, type: e.target.value }))}
                      >
                        {stepTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <input
                        className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs"
                        placeholder="Selector/Located"
                        value={editingStep.selector}
                        onChange={e => setEditingStep(s => ({ ...s, selector: e.target.value }))}
                      />
                      <input
                        className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs"
                        placeholder="Value"
                        value={editingStep.value}
                        onChange={e => setEditingStep(s => ({ ...s, value: e.target.value }))}
                      />
                      <button onClick={() => saveEditStep(idx)} className="ml-1 px-2 py-1 bg-green-500 text-white rounded text-xs">Save</button>
                      <button onClick={cancelEditStep} className="ml-1 px-2 py-1 bg-gray-400 text-white rounded text-xs">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${step.type === 'click' ? 'bg-blue-200 text-blue-800' : step.type === 'input' ? 'bg-yellow-200 text-yellow-800' : step.type === 'navigation' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{step.type}</span>
                      <span
                        className="font-mono text-sm break-all whitespace-pre-wrap max-w-full overflow-x-auto"
                        style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                      >
                        {step.selector || step.url}
                      </span>
                      {step.value !== undefined && (
                        <span
                          className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs break-all whitespace-pre-wrap"
                          style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxWidth: '100%', display: 'inline-block' }}
                        >
                          = "{step.value}"
                        </span>
                      )}
                      <button onClick={() => startEditStep(idx, step)} className="ml-1 px-1 bg-blue-500 text-white rounded text-xs">Edit</button>
                    </>
                  )}
                  <button onClick={() => removeStep(idx)} className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs">Delete</button>
                  {idx > 0 && <button onClick={() => moveStep(idx, -1)} className="ml-1 px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs">↑</button>}
                  {idx < formattedSteps.length - 1 && <button onClick={() => moveStep(idx, 1)} className="ml-1 px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs">↓</button>}
                  {/* Add Step button below each step */}
                  {addStepIdx === idx ? (
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                      <select
                        className="px-2 py-1 rounded text-xs bg-gray-800 text-white dark:bg-gray-800 dark:text-white border border-gray-600"
                        value={newStep.type}
                        onChange={e => setNewStep(s => ({ ...s, type: e.target.value }))}
                      >
                        {stepTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <input
                        className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs"
                        placeholder="Selector/Located"
                        value={newStep.selector}
                        onChange={e => setNewStep(s => ({ ...s, selector: e.target.value }))}
                      />
                      <input
                        className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs"
                        placeholder="Value"
                        value={newStep.value}
                        onChange={e => setNewStep(s => ({ ...s, value: e.target.value }))}
                      />
                      <button onClick={() => saveAddStep(idx)} className="ml-1 px-2 py-1 bg-green-500 text-white rounded text-xs" disabled={!newStep.selector && !newStep.value}>Add</button>
                      <button onClick={cancelAddStep} className="ml-1 px-2 py-1 bg-gray-400 text-white rounded text-xs">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => startAddStep(idx)} className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">+ Add Step Below</button>
                  )}
                </li>
              ))}
              {/* Add Step at the end */}
              {manualTestStarted && manualStatus === 'In Progress' && (
                addStepIdx === formattedSteps.length ? (
                  <li className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                    <select
                      className="px-2 py-1 rounded text-xs bg-gray-800 text-white dark:bg-gray-800 dark:text-white border border-gray-600"
                      value={newStep.type}
                      onChange={e => setNewStep(s => ({ ...s, type: e.target.value }))}
                    >
                      {stepTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <input
                      className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs"
                      placeholder="Selector/Located"
                      value={newStep.selector}
                      onChange={e => setNewStep(s => ({ ...s, selector: e.target.value }))}
                    />
                    <input
                      className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs"
                      placeholder="Value"
                      value={newStep.value}
                      onChange={e => setNewStep(s => ({ ...s, value: e.target.value }))}
                    />
                    <button onClick={() => saveAddStep(formattedSteps.length)} className="ml-1 px-2 py-1 bg-green-500 text-white rounded text-xs" disabled={!newStep.selector && !newStep.value}>Add</button>
                    <button onClick={cancelAddStep} className="ml-1 px-2 py-1 bg-gray-400 text-white rounded text-xs">Cancel</button>
                  </li>
                ) : (
                  <li>
                    <button onClick={() => startAddStep(formattedSteps.length)} className="mt-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">+ Add Step</button>
                  </li>
                )
              )}
            </ol>
            <button
              onClick={saveSteps}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              disabled={saving || saveMessage === 'Saved as automated test!'}
            >
              {saving ? 'Saving...' : saveMessage === 'Saved as automated test!' ? 'Saved!' : 'Save as Automated Test'}
            </button>
            <div className="mt-4">
              {saveMessage && <div className="text-green-600 text-lg">{saveMessage}</div>}
            </div>
          </>
        )}
        {testState === 'completed' && (
          <div>
            <div className="mb-2 text-lg font-semibold">
              Test Case: <span className="text-blue-600 dark:text-blue-300">Demo Test</span>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <span>Status: </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Completed
              </span>
            </div>
            <div className="text-green-600 text-lg mb-4">Test saved as automation!</div>
            <button
              onClick={handleStartNewTest}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Start New Test
            </button>
          </div>
        )}
      </div>
      {!loading && !error && !results && !(manualTestStarted || manualTestComplete) && (
        <div className="text-gray-500 text-lg mt-12 text-center">
          No test is currently running.<br />
          Please execute a test case from the My Sprint page or click the Start Manual Test button to see live test results here.
        </div>
      )}
      {showBugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-2">Create Bug</h2>
            <textarea
              className="w-full h-40 p-2 border rounded mb-2 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
              value={bugDescription}
              onChange={e => setBugDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={submitBug} className="px-4 py-2 bg-blue-600 text-white rounded">Submit Bug</button>
              <button onClick={closeBugModal} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
            </div>
            {bugStatus && <div className="mt-2 text-green-600">{bugStatus}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 

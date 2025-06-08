import React, { useEffect, useState } from 'react';
import { testCaseService } from '../services/api';
import { logActivity, ActivityTypes, createActivityObject } from '../utils/activityLogger';
import ConfirmDialog from '../components/ConfirmDialog';

const API_BASE = process.env.REACT_APP_API_BASE || '';

// Define all possible status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'pending', label: 'Pending' },
  { value: 'error', label: 'Error' },
  { value: 'timeout', label: 'Timeout' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function AutomatedTest() {
  console.log('AutomatedTest component loaded');
  const [automationHistory, setAutomationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewTest, setViewTest] = useState(null);
  const [runTest, setRunTest] = useState(null);
  const [editTest, setEditTest] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [runLogs, setRunLogs] = useState([]);
  const [bugModal, setBugModal] = useState(null);
  const [bugDescription, setBugDescription] = useState('');
  const [bugStatus, setBugStatus] = useState('');
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  // Bulk/Filter state for history
  const [historySelected, setHistorySelected] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  // Bulk/Filter state for run report
  const [runSelected, setRunSelected] = useState([]);
  const [runSearch, setRunSearch] = useState('');
  const [runStatus, setRunStatus] = useState('');
  const [runDateFrom, setRunDateFrom] = useState('');
  const [runDateTo, setRunDateTo] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);
  const [confirmRunDeleteOpen, setConfirmRunDeleteOpen] = useState(false);
  const [runDeleteIds, setRunDeleteIds] = useState([]);
  const [runningTestId, setRunningTestId] = useState(null);
  const [editViewMode, setEditViewMode] = useState(false);
  const [editSteps, setEditSteps] = useState([]);
  const [editViewTestName, setEditViewTestName] = useState('');
  const [editErrors, setEditErrors] = useState([]);
  // Add pagination state at the top of the component:
  const [historyPage, setHistoryPage] = useState(1);
  const [runPage, setRunPage] = useState(1);
  const itemsPerPage = 15;
  // Add sort state for run date:
  const [historySortOrder, setHistorySortOrder] = useState('desc');
  const [runSortOrder, setRunSortOrder] = useState('desc');

  console.log('AutomatedTest useEffect running');

  useEffect(() => {
    fetch('/manual-tests.json')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched automation history:', data);
        let tests = [];
        if (Array.isArray(data)) {
          tests = data;
        } else if (data && typeof data === 'object') {
          tests = [data];
        }
        if (!tests.length) {
          setError('No automated tests found.');
        } else {
          setError('');
        }
        setAutomationHistory(tests.reverse());
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load automation test history');
        setLoading(false);
        console.error('AutomationTest fetch error:', err);
      });
    // Fetch run logs for report tab
    fetch('/automationrunlogs.json')
      .then(res => res.json())
      .then(data => setRunLogs(Array.isArray(data) ? data.reverse() : []))
      .catch(() => setRunLogs([]));
  }, []);

  useEffect(() => {
    if (editViewMode) {
      setEditErrors(validateEditSteps(editSteps));
    }
  }, [editSteps, editViewMode]);

  // View steps modal
  const handleView = (test) => setViewTest(test);
  const closeView = () => setViewTest(null);

  // Run test modal (placeholder)
  const handleRun = async (test) => {
    setRunningTestId(test.timestamp);
    setRunLoading(true);
    setRunResult(null);
    const resp = await fetch(`${API_BASE}/api/run-automation-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: test.timestamp })
    });
    const data = await resp.json();
    setRunLoading(false);
    setRunningTestId(null);
    if (data.success) {
      setRunResult({
        status: data.run.status,
        htmlReport: data.run.htmlReport,
        name: data.run.name,
      });
      // Log activity for running automated test
      try {
        await logActivity({
          title: `Automated Test: ${data.run.name || test.name || 'Automated Test Run'}`,
          description: `Automated test executed. Status: ${data.run.status}.`,
          'Request Type': 'Test Case',
          status: data.run.status === 'passed' ? 'done' : (data.run.status === 'failed' ? 'failed' : 'in progress'),
          'Output Type': 'Test Report',
          createdDate: new Date().toISOString().split('T')[0]
        });
      } catch (e) {
        console.error('Failed to log activity for automated test run:', e);
      }
      // Refresh run logs
      fetch('/automationrunlogs.json')
        .then(res => res.json())
        .then(data => setRunLogs(Array.isArray(data) ? data.reverse() : []));
    } else {
      setRunResult({ status: 'failed', error: data.error || 'Unknown error' });
    }
  };
  const closeRun = () => {
    setRunResult(null);
    // Always refresh run logs after closing the modal
    fetch('/automationrunlogs.json')
      .then(res => res.json())
      .then(data => setRunLogs(Array.isArray(data) ? data.reverse() : []));
  };

  // Edit test name modal
  const handleEdit = (test) => {
    setEditTest(test);
    setEditName(test.name);
  };
  const closeEdit = () => {
    setEditTest(null);
    setEditName('');
  };
  const saveEdit = () => {
    setAutomationHistory(prev => prev.map(t => t === editTest ? { ...t, name: editName } : t));
    // TODO: Save to backend
    closeEdit();
  };

  // Delete test
  const handleDeleteClick = (ids) => {
    setDeleteIds(ids);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    await fetch('/api/automated-tests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: deleteIds })
    });
    setConfirmOpen(false);
    // refresh your data here
  };

  const handleRerun = async (run) => {
    if (!run.testId) return alert('No testId found for rerun');
    setRunningTestId(run.timestamp);
    setRunLoading(true);
    setRunResult(null);
    const resp = await fetch(`${API_BASE}/api/run-automation-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: run.testId })
    });
    const data = await resp.json();
    setRunLoading(false);
    setRunningTestId(null);
    if (data.success) {
      setRunResult({
        status: data.run.status,
        htmlReport: data.run.htmlReport,
        name: data.run.name,
      });
      // Log activity for rerunning automated test
      try {
        await logActivity({
          title: `Automated Test Rerun: ${data.run.name || run.name || 'Automated Test Rerun'}`,
          description: `Automated test rerun. Status: ${data.run.status}.`,
          'Request Type': 'Test Case',
          status: data.run.status === 'passed' ? 'done' : (data.run.status === 'failed' ? 'failed' : 'in progress'),
          'Output Type': 'Test Report',
          createdDate: new Date().toISOString().split('T')[0]
        });
      } catch (e) {
        console.error('Failed to log activity for automated test rerun:', e);
      }
      fetch('/automationrunlogs.json')
        .then(res => res.json())
        .then(data => setRunLogs(Array.isArray(data) ? data.reverse() : []));
    } else {
      setRunResult({ status: 'failed', error: data.error || 'Unknown error' });
    }
  };

  const handleCreateBug = (run) => {
    setBugModal(run);
    setBugDescription(`Test: ${run.name}\nStatus: ${run.status}\nSteps: ${run.steps.length}`);
    setBugStatus('');
  };

  const submitBug = async () => {
    if (!bugDescription.trim()) return;
    const resp = await fetch('/api/create-bug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jiraId: bugModal.testId || '', description: bugDescription })
    });
    const data = await resp.json();
    if (data.success) {
      setBugStatus('Bug created successfully!');
      setTimeout(() => setBugModal(null), 1200);
    } else {
      setBugStatus('Failed to create bug: ' + (data.error || 'Unknown error'));
    }
  };

  // Filtering logic for history
  const filteredHistory = automationHistory.filter(test => {
    const searchMatch = !historySearch || (test.name && test.name.toLowerCase().includes(historySearch.toLowerCase()));
    const statusMatch = !historyStatus || historyStatus === 'all' || (historyStatus === 'saved' && true); // all are saved
    const date = test.timestamp ? new Date(test.timestamp).toISOString().slice(0, 10) : '';
    const fromMatch = !historyDateFrom || date >= historyDateFrom;
    const toMatch = !historyDateTo || date <= historyDateTo;
    return searchMatch && statusMatch && fromMatch && toMatch;
  });
  // Filtering logic for run report
  const filteredRuns = runLogs.filter(run => {
    const searchMatch = !runSearch || (run.name && run.name.toLowerCase().includes(runSearch.toLowerCase()));
    const statusMatch = !runStatus || runStatus === 'all' || run.status === runStatus;
    const date = run.timestamp ? new Date(run.timestamp).toISOString().slice(0, 10) : '';
    const fromMatch = !runDateFrom || date >= runDateFrom;
    const toMatch = !runDateTo || date <= runDateTo;
    return searchMatch && statusMatch && fromMatch && toMatch;
  });
  // Fix sorting for Created Date and Run Date:
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return historySortOrder === 'asc' ? aTime - bTime : bTime - aTime;
  });
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return runSortOrder === 'asc' ? aTime - bTime : bTime - aTime;
  });
  // Paginate sortedHistory and sortedRuns:
  const totalHistoryPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const paginatedHistory = sortedHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
  const totalRunPages = Math.ceil(sortedRuns.length / itemsPerPage);
  const paginatedRuns = sortedRuns.slice((runPage - 1) * itemsPerPage, runPage * itemsPerPage);
  // Bulk actions
  const handleHistorySelectAll = e => {
    if (e.target.checked) setHistorySelected(sortedHistory.map((t, i) => i));
    else setHistorySelected([]);
  };
  const handleHistorySelectOne = idx => {
    setHistorySelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };
  const handleRunSelectAll = e => {
    if (e.target.checked) setRunSelected(sortedRuns.map((r, i) => i));
    else setRunSelected([]);
  };
  const handleRunSelectOne = idx => {
    setRunSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };
  const handleHistoryBulkDelete = () => {
    setDeleteIds(historySelected.map(idx => sortedHistory[idx].timestamp));
    setConfirmOpen(true);
  };
  const handleRunBulkDelete = () => {
    setRunDeleteIds(runSelected.map(idx => sortedRuns[idx].timestamp));
    setConfirmRunDeleteOpen(true);
  };

  const handleEditView = () => {
    setEditSteps(viewTest.steps.map(s => ({ ...s })));
    setEditViewTestName(viewTest.name);
    setEditViewMode(true);
  };
  const handleStepChange = (idx, field, value) => {
    setEditSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const handleRemoveStep = idx => {
    setEditSteps(prev => prev.filter((_, i) => i !== idx));
  };
  const handleInsertStep = idx => {
    setEditSteps(prev => [
      ...prev.slice(0, idx + 1),
      { type: 'navigation', selector: '', value: '' },
      ...prev.slice(idx + 1)
    ]);
  };
  const handleSaveEditView = async () => {
    const errors = validateEditSteps(editSteps);
    setEditErrors(errors);
    if (errors.some(Boolean)) return;
    // Update in backend
    await fetch('/api/update-manual-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: viewTest.timestamp, name: editViewTestName, steps: editSteps })
    });
    // Refresh automationHistory from backend
    fetch('/manual-tests.json')
      .then(res => res.json())
      .then(data => {
        let tests = [];
        if (Array.isArray(data)) {
          tests = data;
        } else if (data && typeof data === 'object') {
          tests = [data];
        }
        setAutomationHistory(tests.reverse());
      });
    setEditViewMode(false);
    setViewTest(null);
  };
  const handleCancelEditView = () => {
    setEditViewMode(false);
  };

  const validateEditSteps = (steps) => {
    return steps.map(step => {
      if (step.type === 'navigation') {
        return !step.url || !step.url.trim();
      } else if (step.type === 'click') {
        return !step.selector || !step.selector.trim();
      } else if (step.type === 'fill') {
        return !step.selector || !step.selector.trim() || !step.value || !step.value.trim();
      }
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-8">
      <h2 className="text-2xl font-bold mb-4">Automated Test</h2>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-300 dark:border-neutral-700">
        <button
          className={`px-4 py-2 font-semibold rounded-t ${activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200'}`}
          onClick={() => setActiveTab('history')}
        >
          Automated Test History
        </button>
        <button
          className={`px-4 py-2 font-semibold rounded-t ${activeTab === 'report' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200'}`}
          onClick={() => setActiveTab('report')}
        >
          Automation Test Run Report
        </button>
      </div>
      {/* Tab Content */}
      {activeTab === 'history' && (
        <>
          {/* Global Filter Bar */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <input type="text" className="border rounded px-3 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700" placeholder="Search tests..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
            <select
              value={historyStatus}
              onChange={(e) => setHistoryStatus(e.target.value)}
              className="border rounded px-2 py-1 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input type="date" className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700" value={historyDateFrom} onChange={e => setHistoryDateFrom(e.target.value)} placeholder="From" />
            <input type="date" className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700" value={historyDateTo} onChange={e => setHistoryDateTo(e.target.value)} placeholder="To" />
            <button
              className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 flex items-center gap-1"
              onClick={() => setHistorySortOrder(historySortOrder === 'asc' ? 'desc' : 'asc')}
              title="Sort by Created Date"
              type="button"
            >
              Created Date <span>{historySortOrder === 'asc' ? '▲' : '▼'}</span>
            </button>
          </div>
          {/* Bulk Actions */}
          {historySelected.length > 0 && (
            <div className="flex items-center mb-2 gap-2">
              <span className="text-sm font-medium">Bulk Actions:</span>
              <button className="px-3 py-1 rounded bg-red-500 text-white text-sm font-semibold hover:bg-red-600" onClick={handleHistoryBulkDelete}>Delete</button>
            </div>
          )}
          {/* Table with checkboxes */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
              <thead>
                <tr className="bg-gray-100 dark:bg-neutral-800">
                  <th className="px-4 py-2"><input type="checkbox" checked={filteredHistory.length > 0 && historySelected.length === filteredHistory.length} onChange={handleHistorySelectAll} /></th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Created Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Output Type</th>
                  <th className="px-4 py-2 text-left">Steps</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
                {runLoading && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, background: 'transparent', border: 0 }}>
                      <div className="zap-header-progress-bar">
                        <div className="zap-header-progress-bar-inner" />
                      </div>
                    </td>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedHistory.map((test, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-neutral-700" style={{ position: 'relative' }}>
                    <td className="px-4 py-2"><input type="checkbox" checked={historySelected.includes(idx)} onChange={() => handleHistorySelectOne(idx)} /></td>
                    <td className="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">{test.name}</td>
                    <td className="px-4 py-2">{(() => { const d = new Date(test.timestamp); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0'); const year = String(d.getFullYear()).slice(-2); return `${day}/${month}/${year}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; })()}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-semibold">Saved</span>
                    </td>
                    <td className="px-4 py-2">Automation Script</td>
                    <td className="px-4 py-2">{test.steps.length}</td>
                    <td className="px-4 py-2 flex gap-2" style={{ position: 'relative' }}>
                      <button onClick={() => handleView(test)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs">View</button>
                      <button
                        onClick={() => handleRun(test)}
                        className={`px-2 py-1 rounded text-xs bg-green-500 text-white ${runningTestId === test.timestamp && runLoading ? 'animate-blink' : ''}`}
                        disabled={runLoading && runningTestId === test.timestamp}
                      >
                        Run
                      </button>
                      <button onClick={() => handleDeleteClick([test.timestamp])} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          {totalHistoryPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setHistoryPage(1)} disabled={historyPage === 1} aria-label="First Page">&#171;</button>
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} aria-label="Previous Page">&#8249;</button>
              {Array.from({ length: totalHistoryPages }, (_, i) => (
                <button key={i + 1} className={`px-3 py-1 rounded ${historyPage === i + 1 ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600'}`} onClick={() => setHistoryPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyPage === totalHistoryPages} aria-label="Next Page">&#8250;</button>
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setHistoryPage(totalHistoryPages)} disabled={historyPage === totalHistoryPages} aria-label="Last Page">&#187;</button>
            </div>
          )}
        </>
      )}
      {activeTab === 'report' && (
        <div className="p-6 bg-gray-50 dark:bg-neutral-800 rounded shadow text-gray-700 dark:text-gray-200">
          {/* Global Filter Bar */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <input type="text" className="border rounded px-3 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700" placeholder="Search runs..." value={runSearch} onChange={e => setRunSearch(e.target.value)} />
            <select
              value={runStatus}
              onChange={(e) => setRunStatus(e.target.value)}
              className="border rounded px-2 py-1 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input type="date" className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700" value={runDateFrom} onChange={e => setRunDateFrom(e.target.value)} placeholder="From" />
            <input type="date" className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700" value={runDateTo} onChange={e => setRunDateTo(e.target.value)} placeholder="To" />
            <button
              className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 flex items-center gap-1"
              onClick={() => setRunSortOrder(runSortOrder === 'asc' ? 'desc' : 'asc')}
              title="Sort by Run Date"
              type="button"
            >
              Run Date <span>{runSortOrder === 'asc' ? '▲' : '▼'}</span>
            </button>
          </div>
          {/* Bulk Actions */}
          {runSelected.length > 0 && (
            <div className="flex items-center mb-2 gap-2">
              <span className="text-sm font-medium">Bulk Actions:</span>
              <button className="px-3 py-1 rounded bg-red-500 text-white text-sm font-semibold hover:bg-red-600" onClick={handleRunBulkDelete}>Delete</button>
            </div>
          )}
          {/* Table with checkboxes */}
          {paginatedRuns.length === 0 ? (
            <div className="text-gray-500">No test runs yet.</div>
          ) : (
            <table className="min-w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg mb-4">
              <thead>
                <tr className="bg-gray-100 dark:bg-neutral-800">
                  <th className="px-4 py-2"><input type="checkbox" checked={filteredRuns.length > 0 && runSelected.length === filteredRuns.length} onChange={handleRunSelectAll} /></th>
                  <th className="px-4 py-2 text-left">Test Name</th>
                  <th className="px-4 py-2 text-left">Run Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Steps</th>
                  <th className="px-4 py-2 text-left">Report</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
                {runLoading && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, background: 'transparent', border: 0 }}>
                      <div className="zap-header-progress-bar">
                        <div className="zap-header-progress-bar-inner" />
                      </div>
                    </td>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedRuns.map((run, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-neutral-700" style={{ position: 'relative' }}>
                    <td className="px-4 py-2"><input type="checkbox" checked={runSelected.includes(idx)} onChange={() => handleRunSelectOne(idx)} /></td>
                    <td className="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">{run.name}</td>
                    <td className="px-4 py-2">{(() => { const d = new Date(run.timestamp); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0'); const year = String(d.getFullYear()).slice(-2); return `${day}/${month}/${year}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; })()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${run.status === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-2">{run.steps.length}</td>
                    <td className="px-4 py-2">
                      <a
                        href="/run-report-1749308558688.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline block mb-2"
                      >
                        View HTML Report
                      </a>
                    </td>
                    <td className="px-4 py-2 flex gap-2" style={{ position: 'relative' }}>
                      <button onClick={() => handleRerun(run)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs">Rerun</button>
                      <button onClick={() => handleCreateBug(run)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Create Bug</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Pagination controls */}
          {totalRunPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setRunPage(1)} disabled={runPage === 1} aria-label="First Page">&#171;</button>
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setRunPage(p => Math.max(1, p - 1))} disabled={runPage === 1} aria-label="Previous Page">&#8249;</button>
              {Array.from({ length: totalRunPages }, (_, i) => (
                <button key={i + 1} className={`px-3 py-1 rounded ${runPage === i + 1 ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600'}`} onClick={() => setRunPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setRunPage(p => Math.min(totalRunPages, p + 1))} disabled={runPage === totalRunPages} aria-label="Next Page">&#8250;</button>
              <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50" onClick={() => setRunPage(totalRunPages)} disabled={runPage === totalRunPages} aria-label="Last Page">&#187;</button>
            </div>
          )}
        </div>
      )}
      {/* View Modal */}
      {viewTest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-2">View Test: {editViewMode ? (
              <input
                className="border rounded px-2 py-1 bg-black text-white w-3/4"
                value={editViewTestName}
                onChange={e => setEditViewTestName(e.target.value)}
              />
            ) : viewTest.name}</h2>
            {editViewMode ? (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }} className="mb-4">
                {editSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <select
                      className="border rounded px-1 py-0.5 text-xs bg-black text-white"
                      value={step.type}
                      onChange={e => handleStepChange(idx, 'type', e.target.value)}
                    >
                      <option value="navigation">navigation</option>
                      <option value="click">click</option>
                      <option value="fill">fill</option>
                    </select>
                    {step.type === 'navigation' && (
                      <>
                        <input
                          className={`border rounded px-1 py-0.5 text-xs w-1/3 bg-black text-white${editErrors[idx] ? ' border-red-500' : ''}`}
                          value={step.url || ''}
                          onChange={e => handleStepChange(idx, 'url', e.target.value)}
                          placeholder="add locator"
                        />
                        {editErrors[idx] && <span className="text-red-500 text-xs ml-1">Required</span>}
                      </>
                    )}
                    {step.type === 'click' && (
                      <>
                        <input
                          className={`border rounded px-1 py-0.5 text-xs w-1/3 bg-black text-white${editErrors[idx] ? ' border-red-500' : ''}`}
                          value={step.selector || ''}
                          onChange={e => handleStepChange(idx, 'selector', e.target.value)}
                          placeholder="add locator"
                        />
                        {editErrors[idx] && <span className="text-red-500 text-xs ml-1">Required</span>}
                      </>
                    )}
                    {step.type === 'fill' && (
                      <>
                        <input
                          className={`border rounded px-1 py-0.5 text-xs w-1/3 bg-black text-white${editErrors[idx] ? ' border-red-500' : ''}`}
                          value={step.selector || ''}
                          onChange={e => handleStepChange(idx, 'selector', e.target.value)}
                          placeholder="add locator"
                        />
                        <input
                          className={`border rounded px-1 py-0.5 text-xs w-1/4 bg-black text-white${editErrors[idx] ? ' border-red-500' : ''}`}
                          value={step.value || ''}
                          onChange={e => handleStepChange(idx, 'value', e.target.value)}
                          placeholder="add value"
                        />
                        {editErrors[idx] && <span className="text-red-500 text-xs ml-1">Required</span>}
                      </>
                    )}
                    <button onClick={() => handleRemoveStep(idx)} className="text-red-500 text-xs">Delete</button>
                    <button onClick={() => handleInsertStep(idx)} className="text-green-500 text-xs ml-2" type="button">+ Step</button>
                  </div>
                ))}
              </div>
            ) : (
              <ol
                className="mb-4"
                style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}
              >
                {viewTest.steps.map((step, idx) => {
                  const type = step.type;
                  const rest = `${step.selector || step.url || ''}${step.value ? ' = ' + step.value : ''}`;
                  return (
                    <li key={idx} className="mb-1 font-mono text-xs">
                      <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>[{type}]</span> {rest}
                    </li>
                  );
                })}
              </ol>
            )}
            <div className="flex gap-2 justify-end">
              {editViewMode ? (
                <>
                  <button onClick={handleSaveEditView} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={editErrors.some(Boolean)}>Save</button>
                  <button onClick={handleCancelEditView} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                </>
              ) : (
                <button onClick={handleEditView} className="px-4 py-2 bg-yellow-500 text-white rounded">Edit</button>
              )}
              <button onClick={closeView} className="px-4 py-2 bg-gray-400 text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Run Modal (placeholder) */}
      {runResult && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded shadow-lg w-full max-w-lg text-center">
            <h2 className="text-lg font-bold mb-2">
              Test Run {runResult.status === 'passed' ? 'Passed' : 'Failed'}
            </h2>
            {runResult.error && (
              <div className="text-red-500 mb-2">{runResult.error}</div>
            )}
            <button
              onClick={closeRun}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editTest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-2">Edit Test Name</h2>
            <input
              className="w-full p-2 border rounded mb-2 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              <button onClick={closeEdit} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Status */}
      {deleteStatus && <div className="mt-4 text-green-600">{deleteStatus}</div>}
      {/* Bug Modal */}
      {bugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-2">Create Bug for: {bugModal.name}</h2>
            <textarea
              className="w-full p-2 border rounded mb-2 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
              rows={5}
              value={bugDescription}
              onChange={e => setBugDescription(e.target.value)}
            />
            {bugStatus && <div className="mb-2 text-green-600">{bugStatus}</div>}
            <div className="flex gap-2">
              <button onClick={submitBug} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              <button onClick={() => setBugModal(null)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Automated Test(s)"
        message="Are you sure you want to delete the selected test(s)? This action cannot be undone."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await fetch('/api/delete-automated-tests', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: deleteIds })
          });
          setConfirmOpen(false);
          // Refresh automationHistory
          fetch('/manual-tests.json')
            .then(res => res.json())
            .then(data => {
              let tests = [];
              if (Array.isArray(data)) {
                tests = data;
              } else if (data && typeof data === 'object') {
                tests = [data];
              }
              setAutomationHistory(tests.reverse());
            });
          setHistorySelected([]);
        }}
      />
      {/* Confirm Dialog for Run Report Bulk Delete */}
      <ConfirmDialog
        open={confirmRunDeleteOpen}
        title="Delete Automation Test Run(s)"
        message="Are you sure you want to delete the selected run(s)? This action cannot be undone."
        onCancel={() => setConfirmRunDeleteOpen(false)}
        onConfirm={async () => {
          await fetch('/api/delete-automation-test-runs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: runDeleteIds })
          });
          setConfirmRunDeleteOpen(false);
          // Refresh run logs
          fetch('/automationrunlogs.json')
            .then(res => res.json())
            .then(data => setRunLogs(Array.isArray(data) ? data.reverse() : []));
          setRunSelected([]);
        }}
      />
    </div>
  );
}